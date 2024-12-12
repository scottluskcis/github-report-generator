import logger from "./shared/app-logger";
import { runCopilotAssociationsReport } from "./report/copilot-associations-report";

// Mock the logger and report function
jest.mock("./shared/app-logger");
jest.mock("./report/copilot-associations-report");

describe("index.ts", () => {
  it("should log start and end messages", async () => {
    const mockLoggerInfo = logger.info as jest.Mock;
    const mockRunReport = runCopilotAssociationsReport as jest.Mock;

    // Mock the report function to resolve with a test file name
    mockRunReport.mockResolvedValue("test-output-file.txt");

    // Import the index file to trigger the code
    await import("./index");

    // Check that the start message was logged
    expect(mockLoggerInfo).toHaveBeenCalledWith("START - Running copilot associations report...");

    // Check that the end message was logged with the correct file name
    expect(mockLoggerInfo).toHaveBeenCalledWith("END - Generated copilot associations report test-output-file.txt");
  });
});