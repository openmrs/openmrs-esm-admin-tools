import React from 'react';
import * as cronjsParser from '@datasert/cronjs-parser';
import * as cronjsMatcher from '@datasert/cronjs-matcher';
import moment from 'moment';

interface NextReportExecutionProps {
  schedule: string;
  currentDate: Date;
}

const NextReportExecution: React.FC<NextReportExecutionProps> = ({ schedule, currentDate }) => {
  const nextReportExecutionDate = (() => {
    if (!schedule) {
      return '';
    }

    const expression = cronjsParser.parse(schedule, { hasSeconds: true });
    const nextExecutions = cronjsMatcher.getFutureMatches(expression, {
      startAt: currentDate.toISOString(),
      matchCount: 1,
    });
    return nextExecutions.length == 1 ? moment.utc(nextExecutions[0].toString()).format('YYYY-MM-DD HH:mm') : '';
  })();

  return <span>{nextReportExecutionDate}</span>;
};

export default NextReportExecution;
