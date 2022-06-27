#!/usr/bin/env bash

# Wait for contracts migration and extract Keeper artifacts

RETRY_COUNT=0
COMMAND_STATUS=1
CONF_DIR=${LOCAL_CONF_DIR:-~/.nevermined}

ARTIFACTS_DIR=$CONF_DIR/nevermined-contracts/artifacts/
CIRCUITS_DIR=$CONF_DIR/nevermined-contracts/circuits/

mkdir -p $ARTIFACTS_DIR
mkdir -p $CIRCUITS_DIR

printf "\nUsing conf dir: $CONF_DIR\n"
printf '\n\e[33m◯ Waiting for contracts to be generated...\e[0m\n'



until [ $COMMAND_STATUS -eq 0 ] || [ $RETRY_COUNT -eq 120 ]; do
  nevermined_keeper_docker_id=$(docker container ls | grep nevermined-keeper-node | awk '{print $1}')
  docker cp ${nevermined_keeper_docker_id}:/nevermined-contracts/artifacts/ready $ARTIFACTS_DIR
  COMMAND_STATUS=$?
  sleep 5
  let RETRY_COUNT=RETRY_COUNT+1
done


if [ $COMMAND_STATUS -ne 0 ]; then
  echo "Waited for more than two minutes, but nevermined contracts have not been migrated yet. Did you run an Ethereum RPC client and the migration script?"
  exit 1
fi

printf '\e[32m✔ Found new contract artifacts.\e[0m\n'

docker cp ${nevermined_keeper_docker_id}:/nevermined-contracts/artifacts/. $ARTIFACTS_DIR

docker cp ${nevermined_keeper_docker_id}:/nevermined-contracts/circuits/keytransfer.wasm $CIRCUITS_DIR
docker cp ${nevermined_keeper_docker_id}:/nevermined-contracts/circuits/keytransfer.zkey $CIRCUITS_DIR

find $CONF_DIR -type f

printf '\e[32m✔ Copied new contract artifacts and circuits.\e[0m\n'


