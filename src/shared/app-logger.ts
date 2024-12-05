import { Logger } from "tslog";
import { AppConfig } from "./app-config";
import { appendFileSync } from "fs";
import { format } from "date-fns";
import { appendToFile } from "./file-utils";

/*
log levels
0: silly
1: trace
2: debug
3: info
4: warn
5: error
6: fatal
*/

const min_level: number = AppConfig.MIN_LOG_LEVEL;
const type = AppConfig.LOG_TYPE as "json" | "pretty" | "hidden";
const hideLogPositionForProduction: boolean = AppConfig.HIDE_LOG_POSITION;

export const logger = new Logger({
  name: "app-logger",
  minLevel: min_level,
  type: type,
  hideLogPositionForProduction: hideLogPositionForProduction,
});

if (AppConfig.OUTPUT_LOG_TO_FILE) {
  const output_file = `logs_${format(new Date(), "yyyy-MM-dd")}.txt`;
  logger.attachTransport((logObj) => {
    if(hideLogPositionForProduction) {
        delete logObj._meta;
    }

    appendToFile(output_file, logObj);
  });
}

export default logger;
