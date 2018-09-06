import React from 'react';
import Link from 'gatsby-link';

import Wrapper from './Wrapper';
import imgSrc from '../../main.jpg';

function HeaderImage() {
  return (
    <Wrapper>
      <Link to="/">
        <img alt="Main Logo" src={imgSrc} />
      </Link>
    </Wrapper>
  );
}

export default HeaderImage;