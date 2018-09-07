---
title: Introduction to HarfBuzz
date: '2018-09-07'
featuredImage: './featured.jpg'
---

In this post I want to introduce the HarfBuzz text shaping engine and give a quick overview over the most important parts in its API. I did not find a lot of help online on how to use this library and hope this post helps.

<!-- end -->

# What is HarfBuzz?

[HarfBuzz][harfbuzz] ([developed on Github][harfbuzz-git]) is a cross-platform C++ library (with a C API) that describes itself as "an OpenType text shaping engine"[^hb-home]. But what does that mean? To discuss this we first have to look at what _OpenType_ is and how it works. If you already know HarfBuzz' purpose and understand what it does you can skip this section and look directly at the code in the following section.

## Opentype

[_OpenType_][wiki-ot] is a modern font format that is supported by every major operating system. But OpenType is a complex format including features that allow correct text rendering for many many languages and writing systems. This is more difficult than you may imagine (the [Opentype specification][ot-spec] is hundreds of pages long) but I will try to give you a glimpse of what is possible.

A font file by its nature contains a list of so-called _glyphs_. Fonts **are**—so to speak—about glyphs. A glyph is the visual representation of a small portion of text and can be stored either as a vector outline of the shape or as a bitmap. OpenType supports both. For latin scripts a glyph typically represents a single character or symbol, like _U_ or _§_ or _🎉_. But even for the simple latin script there are exceptions like _ligatures_. Ligatures are composite glyphs that represent more than one character and are used by typesetters to produce better layout. Sometimes using ligatures instead of the individual glyphs simply looks better but in some scripts (e.g. arabic) ligatures are needed for correct text display. The most common ligature in english texts is the "fi" ligature where some fonts join the dot of the i with the top of the f.

<figure>
<img alt="fi ligature substitution and st ligature substitution" src="./ligatures.svg" width="150px">
<figcaption>
Two examples of OpenType ligature substitutions
</figcaption>
</figure>

Ligatures are one of many _features_ available for use in OpenType fonts that control advanced text layout. In OpenType features are named using simple 4-byte tags like `liga` for ligatures (which is activated by default). In fact the st ligature in the figure is called a [discretionary ligature](https://creativepro.com/typetalk-standard-vs-discretionary-ligatures/) and can be activated with the `hlig`-feature (historical ligatures). A complete list of font features is available [here][ot-feat]. I want to stress that advanced text layout is by no means an optional consideration given that most non-latin scripts require the use of font-features to be displayed correctly.

Aside from glyphs a font contains information regarding the positioning of glyphs when they should be laid out next to each other. For simplicity and due to my lack of experience with foreign scripts I will only discuss left to right text here. Each glyph in a font specifies an intrinsic advance width as the distance from its coordinate origin to the coordinate origin of the following glyph. One common need in text layout is _glyph kerning_ when the advance width should depend on the following glyph. A kern is a small fixed positive or negative space additionally inserted between adjacent glyphs. It improves the visual quality of text, especially for glyph combinations like "VA" where the V and the A would be too far apart without a small negative kern inserted between them. OpenType does not only allow pairwise kerning that but also support contextual positioning through the [`GPOS` table][gpos]. As you may have guessed there exist many more rules for positioning glyphs (e.g. mark placement, superscripts and subscripts for chemistry) that can be enabled or disabled using font features.

## The Role of HarfBuzz

Now HarfBuzz comes into play. HarfBuzz usually is a part of a so-called _text stack_ and is used in almost all linux systems ([read about the text stack in Linux][textstack]). This pipeline is needed for processing all text that a user inputs e.g. through a keyboard until the glyphs are displayed on screen. There are many steps to be done including splitting the text into lines, bidirectional reordering, mapping characters to glyphs, determining the glyphs' positions and generating pixel images from their vector outlines. HarfBuzz basically does the character-to-glyph-conversion and controls the glyphs positioning: It takes a sequence of Unicode characters and returns a sequence of glyphs with information how to lay them out on one line. How does it do that? By looking at all font features that are enabled and performing the necessary lookups and replacement rules defined in the font to select the correct glyphs (zero, one or many) for each character.

# The C API of HarfBuzz

So, that's enough theory at least for the moment. We will now take a look at the functions and types that HarfBuzz provides us with. To use the basic C API of HarfBuzz you simply have to `#include "hb.h"` which includes all types and functions needed.

HarfBuzz aims to be as portable as possible and exposes a C API for easy integration into any system. The API is also designed to be thread-safe with memory management done through atomic reference counting. Unfortunately the [API documentation](https://harfbuzz.github.io) of HarfBuzz is not very extensive and it is the reason for writing this article to provide a quick but useful introduction. Still you should consult the documentation a lot since the function names themselves are relatively self-explanatory and you get a good idea what this library is capable of and what is out of scope.

It should also be mentioned that there exists a python wrapper for HarfBuzz that is maintained in the same repository as HarfBuzz itself.

## Overview of the shaping process

The main function in HarfBuzz that "does all the work" is `hb_shape`. Its full signature reads

```c
void hb_shape (
    hb_font_t *font,
    hb_buffer_t *buffer,
    const hb_feature_t *features,
    unsigned int num_features
);
```

From it we can infer that to perform shaping we need to tell HarfBuzz

- which font we want it to use
- what text we want laid out (the `hb_buffer_t` argument is essentially a text buffer)
- which (OpenType) features we want to activate.

In the following sections I will talk about how to get a font and a buffer. The features are just a simple array of `hb_feature_t` struct elements that is pretty self-explanatory.

What also remains to be seen is how this functions gives us the result of the shaping process (its return value is just `void`). But first some words about HarfBuzz's object oriented approach using memory management based on reference counting.

## Object system

HarfBuzz' API mainly consists of a number of important structs and corresponding functions to create, mutate and destroy them. The object-orientedness of the library is reinforced through naming conventions.

HarfBuzz' type and function names are in [snake_case][snake-case] and generally prefixed by `hb_` to avoid name clashes. For classes (exposed as [opaque pointers][opaque]) this is followed by the class name and the `_t` suffix for "type" (examples: `hb_font_t`, `hb_buffer_t`). Methods for those classes also have the `hb_` prefix followed by the class name of the class they correspond to. After an underscore follows the method's name. Examples of complete method names are `hb_font_create` and `hb_buffer_add_codepoint`.

Besides their own specific methods all classes define a few core methods for reference counting and for ensuring thread safety (or using the object oriented slang, they inherit them from a hypothetical `hb_object_t` class):

### Object API

Every object in Harfbuzz uses functions with the signature

```c
hb_object_t *hb_object_create(/* constructor arguments */);
hb_object_destroy(hb_object_t *obj);
```

for creating respectively destroying (i.e. decreasing reference count) itself. `hb_object` here and thereafter is a placeholder for any harfbuzz object name, so the actual functions are called e.g.

```c
hb_font_t *hb_font_create(hb_face_t *face);
hb_font_destroy(hb_font_t *font);
```

## Blob

Harfbuzz uses the `hb_blob_t` type to represent regions of memory that can be used for various tasks. The most important use of blobs is to create them for a font file and the use that blob to create `hb_face_t`s. Though somewhat out of date most of the design decisions made for `hb_blob_t` are described in [this mailing list post][api-design] (beware however that many changes to the API have been made since).

Blobs have two different constructors. The following code snippet shows first how to create a blob from the contents of a given file and secondly how to create a blob from a pointer to allocated data.

**Creating a blob from the contents of a file:**

```c
hb_blob_t *blob;
const char *file_name = "path/to/some/file";
blob = hb_blob_create_from_file(file_name);
```

**Creating a blob from data in memory:**

```c
/* A function defined somewhere in your code */
void data_free(void *data) {
    free(data);
}

hb_blob_t *blob;
unsigned int data_len = /* data size */;
void *data = malloc(data_len);
/* read the font data from somewhere */
read_font(data);
blob = hb_blob_create(data, data_len, HB_MEMORY_MODE_READONLY, NULL, data_free);
```

The `NULL` argument can be used for custom data you want to attach to the blob. The last argument of `hb_blob_create` is a pointer to a function that can deallocate the blob's memory after it is destroyed.

**Remember to destroy the blob after you're done!**

```c
hb_blob_destroy(blob);
```

## Face

A face represents a single typeface that assigns a set of glyphs to unicode codepoints. An example is "Times New Roman Bold" (note that this includes only the bold glyphs even if the font file also contains other font shapes). A `hb_face_t` is most often created from a `hb_blob_t`, a type responsable for memory management in harfbuzz. A face is then needed to create `hb_font_t`s for shaping.

The main ways to create a `hb_face_t` are called

```c
// using a blob
hb_face_t *hb_face_create (hb_blob_t *blob, unsigned int index);

// using a function pointer that provides font table blobs
hb_face_t *hb_face_create_for_tables (
    hb_reference_table_func_t reference_table_func,
    void *user_data,
    hb_destroy_func_t destroy
);
```

The first of these is used if you want to create a `hb_face_t` object directly from a font file that is loaded into memory. The `index` argument is needed because a single font file can contain various faces and you need to select which one you want (usually this number is provided by some font-selection library like fontconfig).

The second constructor is preferable if you don't have a full in-memory copy of the font file however you can produce all font table data on demand. This could be the case e.g. if you are sanitizing or otherwise modifying font tables before use.

## Font

In HarfBuzz a font is the representation of a font face at a specific size e.g. Times New Roman Bold at 13pt. It is by far the most complex of HarfBuzz' types. If you want to shape any text in harfbuzz, you need to create a `hb_font_t` object. A typical and extensively commented font creation routine will look similar to the following (note that there is no error handling):

```c
hb_blob_t *blob;
hb_face_t *face;
hb_font_t *font;

const char *file_name = "path/to/my/font.otf";
blob = hb_blob_create_from_file(file_name);

face = hb_face_create(blob);

font = hb_font_create(face);

/*  The face can be destroyed here already if it is not needed anymore
    as it is referenced internally by the font.  */
hb_face_destroy(face);

/* Make the font use the included opentype font functions. */
hb_ot_font_set_funcs(font);

/*  set the scale factor of the font (the strange values will be discussed
    below) */
hb_font_set_scale(font, 13 << 6, 13 << 6);

/* set the pixels per em value of the font */
hb_font_set_ppem(font, 92, 92);

/* ========================== */
/* do something with the font */
/* ========================== */

/* clean up */
hb_font_destroy(font);
```

Usually you create a font from a `hb_face_t` using the function `hb_font_t *hb_font_create(hb_face_t *face)` like shown here. The face then gets associated to the new font and can be retrieved using `hb_font_get_face`. Like all constructor functions `hb_font_create` returns a pointer to an internally allocated font that must be released with `hb_font_destroy` after it is no longer needed to avoid leaking memory.

### Font scale and ppem

Further properties of a `hb_font_t` are its scale and its ppem that are used to scale the glyphs to the correct size. A scale value of `13 << 6` may be interpreted as a fixed-point value where 13 is the standard EM-size of the font and the six left-shifts give us six bits of subpixel precision in the values that harfbuzz returns. For example if the advance width of some glyph was exactly one EM, then HarfBuzz would return the value you specified as the scaling value in that direction. The six bit shift is also the convention that FreeType uses for fractional pixel values. The PPEM value indicates how many _pixels_ fit inside an EM and is not that important as it (as far as I know) only affects fonts that include so-called [_device tables_][device_tables] to slightly improve positioning on screens with low resolution (which are becoming less and less common).

You may set the scale as well as the ppem values to zero. This will tell HarfBuzz to do the shaping in the design coordinate system of the font without any scaling so you can apply your preferred scaling afterwards. This can often be the recommended method to use harfbuzz as no rounding errors are introduced during shaping and shaping can be performed independently of the font size. This will however turn off metric hinting which you may or may not want. For an excellent and thorough discussion of metric hinting and linear font scaling written by the author of HarfBuzz look [here][metric_hinting].

### Font functions and subclassing

HarfBuzz is designed to work with any underlying font support system by allowing to set custom font functions on a font object. These font functions retrieve various properties of a font that are needed by HarfBuzz for the shaping process. Examples of these properties are the advance width of individual glyphs or the glyhp index corresponding to a specific unicode codepoint.

Today HarfBuzz comes with its own code to access all needed information from font files and therefore usually you would just call

```c
hb_ot_font_set_funcs(font);
```

on your font and are good to go (this function resides in the header `hb_ot.h`). However it is good to know that you can change the underlying font-funcs to use another library (e.g. FreeType) for font access.

## Text and glyph buffers

Now we understand the most important parts of fonts in HarfBuzz. Now we will look at how to feed text into HarfBuzz to get glyph indices and glyph positions out. The central object to understand is `hb_buffer_t`.

A `hb_buffer_t` serves a double role in HarfBuzz. It is needed in the central `hb_shape` function specifying the input text and after completion of shaping contains the positions and information of the resulting glyphs.

Consider the following example:

```c
hb_buffer_t *buffer;

unsigned int num_glyph_infos;
hb_glyph_info_t *glyph_infos;

unsigned int num_glyph_pos;
hb_glyph_position_t *glyph_pos;

/* we assume we created this font already */
hb_font_t *font;

/* some fantasy function that retrieves the utf8 encoded bytes we want to shape */
const char *bytes = get_utf8_bytes();
/* some fantasy function that retrieves number of encoded characters */
/* (this is not the byte count!!!) */
int text_length = get_text_length();

buffer = hb_buffer_create();
hb_buffer_add_utf8(buffer, bytes, text_length, 0, text_length);

/* guess language and script of the buffer */
hb_buffer_guess_segment_properties (buffer);

/* shape the text without any features */
hb_shape(font, buffer, NULL, 0);

/* retrieve the shaping results from the buffer */
glyph_infos = hb_buffer_get_glyph_infos(buffer, &num_glyph_infos);
glyph_pos = hb_buffer_get_glyph_positions(buffer, &num_glyph_pos);

/* don't forget to clean up */
hb_buffer_destroy(buffer);
```

Here we see a very simple example of how a buffer is used to shape some text. First we fill the buffer with some UTF-8 encoded text using `hb_buffer_add_utf8`. There are also functions to fill the buffer from differently encoded data. Next we guess the segment properties of the buffer, namely script, language and direction. Of course you can set these properties individually as well. Then we call `hb_shape` which does the work needed to go from characters to glyphs using complex text layout. Finally we can extract the glyph indices and glyph positions from the buffer and use the results to print some text to the screen.

# Conclusion

I hope you liked this (not so brief) tour of HarfBuzz. For more information look at the [documentation][docs] of HarfBuzz or directly inspect the relevant header files. In the [Github Repository][harfbuzz-git] there are also some example which are great to get started.

[harfbuzz]: https://www.freedesktop.org/wiki/Software/HarfBuzz/
[harfbuzz-git]: https://github.com/behdad/harfbuzz
[wiki-ot]: https://en.wikipedia.org/wiki/OpenType
[ot-spec]: https://www.microsoft.com/en-us/Typography/OpenTypeSpecification.aspx
[ot-feat]: https://www.microsoft.com/typography/otspec/featurelist.htm
[textstack]: http://behdad.org/text/
[opaque]: http://blog.aaronballman.com/2011/07/opaque-data-pointers/
[snake-case]: https://en.wikipedia.org/wiki/Snake_case
[bindgen]: https://github.com/servo/rust-bindgen
[hb-sys]: https://crates.io/crates/harfbuzz-sys
[hb-math]: http://frederic-wang.fr/opentype-math-in-harfbuzz.html
[gpos]: https://www.microsoft.com/typography/otspec/gpos.htm
[metric_hinting]: https://docs.google.com/document/d/1wpzgGMqXgit6FBVaO76epnnFC_rQPdVKswrDQWyqO1M/edit
[device_tables]: https://docs.microsoft.com/de-de/typography/opentype/spec/chapter2#device-and-variationindex-tables
[api-design]: https://mail.gnome.org/archives/gtk-i18n-list/2009-August/msg00025.html
[docs]: https://harfbuzz.github.io

[^hb-home]:

  [HarfBuzz Website][harfbuzz]. The primary credit for the development of HarfBuzz goes to [Behdad Esfahbod](http://behdad.org) who designed most of its API and wrote almost all the code.
