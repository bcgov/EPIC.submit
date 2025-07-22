import React from "react";
import { mount } from "cypress/react18";
import { Project } from "../../../src/components/Projects/Project";
import { TestWrapper } from "../../utils/TestWrapper";

const MockProjectComponent = () => {
  return (
    <Project
      accountProject={{
        project: {
          name: "Test Project 2",
          ea_certificate: "1234",
        },
        packages: [],
      }}
    />
  );
};
describe("<Project />", () => {
  it("renders", () => {
    mount(<TestWrapper component={MockProjectComponent} />);
    cy.contains("Test Project");
  });
});
