import React from "react";
import { mount } from "cypress/react18";
import { ProjectsPage } from "../../../src/routes/proponent/_proponentLayout/projects";
import { useAccount } from "../../../src/store/accountStore";
import { mockZustandStore, setupTokenStorage } from "../utils";
import { AppConfig } from "../../../src/utils/config";
import { TestWrapper } from "../../utils/TestWrapper";

describe("<ProjectsPage />", () => {
  beforeEach(() => {
    mockZustandStore(useAccount, {
      proponentId: 201,
      accountId: 1,
      isLoading: false,
    });
    setupTokenStorage();
    cy.intercept(
      "GET",
      `${AppConfig.apiUrl}/projects/accounts/1?search_text=&submitted_on_start=&submitted_on_end=`,
      [
        {
          id: 1,
          project_id: 1,
          account_id: 1,
          name: "Test Project",
          project: {
            id: 1,
            name: "Test Project",
            ea_certificate: "1234",
          },
          packages: [],
        },
      ],
    ).as("getProjects");
  });
  it("renders", () => {
    mount(<TestWrapper component={ProjectsPage} />);

    cy.wait("@getProjects");
    cy.contains("Test Project");
  });
});
