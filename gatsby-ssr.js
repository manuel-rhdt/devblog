const server = require("react-dom/server");
const sc = require("styled-components");

exports.replaceRenderer = ({
  bodyComponent,
  replaceBodyHTMLString,
  setHeadComponents
}) => {
  const sheet = new sc.ServerStyleSheet();
  const bodyHTML = server.renderToString(bodyComponent);
  replaceBodyHTMLString(bodyHTML);
  setHeadComponents([sheet.getStyleElement()]);
};