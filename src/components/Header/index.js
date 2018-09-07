import React from 'react'

import Container from '../Container'
import HeaderImage from '../HeaderImage'
import H1 from '../H1'
import P from './P'
import Link from './Link'
import Wrapper from './Wrapper'
import { StaticQuery, graphql } from 'gatsby'

function Header() {
  return (
    <Container>
      <Wrapper>
        <StaticQuery
          query={graphql`
            {
              site {
                siteMetadata {
                  showHeaderImage
                  author
                  tagline
                  social {
                    github
                  }
                }
              }
            }
          `}
          render={data => (
            <>
              {data.site.siteMetadata.showHeaderImage && <HeaderImage />}
              <H1>
                <Link to="/">{data.site.siteMetadata.author}</Link>
              </H1>
              <P>{data.site.siteMetadata.tagline}</P>
            </>
          )}
        />
      </Wrapper>
    </Container>
  )
}

export default Header
