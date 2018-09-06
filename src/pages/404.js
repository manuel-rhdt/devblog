import React from 'react';
import styled from 'styled-components';

import H2 from '../components/H2';
import Layout from '../components/Layout'

const Wrapper = styled.div`
  text-align: center;
`;

function NotFound() {
  return (
    <Layout>
      <Wrapper>
        <H2>Sorry, that page was not found.</H2>
      </Wrapper>
    </Layout>
  );
}

export default NotFound;