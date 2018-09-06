import { injectGlobal } from 'styled-components';
import styledNormalize from 'styled-normalize';
import 'typeface-open-sans';
 
injectGlobal`
  ${styledNormalize}
  
  *,
  *:before,
  *:after {
    box-sizing: inherit;
  }

  html {
    font-size: 62.5%;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    box-sizing: border-box;
  }

  body {
    background: #f9fafc;
    font-family: 'Open Sans', sans-serif; 
    line-height: 1.5;
    padding: 50px 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    @media only print {
      text-align: justify;
    }
  }

  img {
    max-width: 100%;
  }

  figure {
    text-align: center;
  }

  .gatsby-highlight {
    border-bottom: 1px solid #e0e6ed;
    border-top: 1px solid #e0e6ed;
    margin: 15px -100px;
    padding: 0;

    @media only print {
      margin: 15px 3em;
    }

    pre[class*="language-"] {
      margin: 0;
      padding: 25px 100px;

      @media only print {
        padding: 25px 1em;
      }
    }
  }

  pre[class*="language-"] {
    background: #f5f2f0;
  }

  @media only screen and (max-width: 870px) {
    .gatsby-highlight {
      margin: 15px -15px;

      pre[class*="language-"] {
        padding: 25px;
      }
    }
  }
`;