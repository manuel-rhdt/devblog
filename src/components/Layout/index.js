import React from 'react'
import PropTypes from 'prop-types'
import 'prismjs/themes/prism.css'
import '../../global-styles'

import Header from '../Header'

const Layout = ({ children }) => (
  <div>
    <Header />
    {children}
  </div>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
