#!/bin/bash
ssh root@notedown.oyam.su "\
  cd notedown && \
  git pull && \
  docker-compose build && \
  docker-compose stop && \
  docker-compose up -d\
"
