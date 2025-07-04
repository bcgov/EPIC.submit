import React from "react";
import { mount } from "cypress/react18";
import { ProjectsPage } from "../../../src/routes/proponent/_proponentLayout/projects";
import { useAccount } from "../../../src/store/accountStore";
import { mockZustandStore, setupTokenStorage } from "../utils";
import { AppConfig } from "../../../src/utils/config";
import { TestWrapper } from "../utils/TestWrapper";
import { USER_TYPE } from "../../../src/models/User";

describe("<ProjectsPage />", () => {
  beforeEach(() => {
    mockZustandStore(useAccount, {
      userType: USER_TYPE,
    });
    setupTokenStorage();
  });
  it("renders", () => {
    mount(<TestWrapper component={ProjectsPage} />);

    cy.wait("@getProjects");
    cy.contains("Test Project");
  });
});
