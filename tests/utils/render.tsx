import React from 'react';
import { render } from '@testing-library/react';
import { AlertProvider, useAlert } from '@/context/alert-context';

/** Shows the current alert as plain text so tests can read error messages. */
function AlertProbe() {
  const { isAlertOpen, alertContent } = useAlert();
  return isAlertOpen ? <div role="alert" data-testid="app-alert">{alertContent.title}: {alertContent.description}</div> : null;
}

export function renderApp(ui: React.ReactElement) {
  return render(<AlertProvider>{ui}<AlertProbe /></AlertProvider>);
}

/** A structurally valid (unsigned) JWT, enough for the UI which only decodes it. */
export function fakeJwt(payload: Record<string, unknown>) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}
