#!/bin/bash

# Handle OpenShift random UID assignment
# OpenShift assigns random UIDs at runtime which causes go-crond's user lookup to fail
if ! whoami &> /dev/null; then
  if [ -w /etc/passwd ]; then
    echo "default:x:$(id -u):0:default user:${HOME}:/sbin/nologin" >> /etc/passwd
  fi
fi

function start_cron_jobs() {
  echo "Starting go-crond as a background task ..."
  CRON_CMD="go-crond -v --allow-unprivileged --include=cron/"
  exec ${CRON_CMD}
}

start_cron_jobs