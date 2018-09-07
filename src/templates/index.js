import React from 'react'
import Helmet from 'react-helmet'

import Card from '../components/Card'
import Container from '../components/Container'
import Summary from '../components/Summary'
import Pagination from '../components/Pagination'
import Layout from '../components/Layout'
import { StaticQuery, graphql } from 'gatsby'

const IndexPage = ({ pageContext }) => {
  const { group, index, pageCount } = pageContext
  const previousUrl = index - 1 === 1 ? '' : (index - 1).toString()
  const nextUrl = (index + 1).toString()
  return (
    <Layout>
      <Container>
        <StaticQuery
          query={graphql`
            query HeadingQuery {
              site {
                siteMetadata {
                  title
                  author
                }
              }
            }
          `}
          render={data => (
            <>
              <Helmet
                title={`${data.site.siteMetadata.title} | ${
                  data.site.siteMetadata.author
                }`}
              />
            </>
          )}
        />
        {group.map(({ node }) => (
          <Card key={node.fields.slug}>
            <Summary
              date={node.frontmatter.date}
              title={node.frontmatter.title}
              excerpt={node.excerpt}
              slug={node.fields.slug}
            />
          </Card>
        ))}
        <Pagination
          isFirst={index === 1}
          isLast={index === pageCount}
          nextUrl={nextUrl}
          previousUrl={previousUrl}
        />
      </Container>
    </Layout>
  )
}
export default IndexPage
