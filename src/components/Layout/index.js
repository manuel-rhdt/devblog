import React from 'react'
import PropTypes from 'prop-types'
import 'prismjs/themes/prism.css'
import '../../global-styles'
import userConfig from '../../../config'

import Header from '../Header'

const Layout = ({ children }) => (
  <div>
    <Header config={userConfig} />
    {children}
  </div>
)

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  location: PropTypes.object,
  route: PropTypes.object,
}

export default Layout
