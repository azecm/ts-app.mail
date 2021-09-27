import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`

  * {
    scrollbar-width: thin;
  }

  html, body {
    height: 100%;
  }

  body {
    margin: 0;
    background-color: #f2f2f2;
    display: flex;
    flex-direction: column;
  }

  #root {
    position: absolute;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
`;
