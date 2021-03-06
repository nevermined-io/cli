package io.keyko.nevermined.cli.modules.contract;

import io.keyko.nevermined.cli.NetworkCommand;
import io.keyko.nevermined.cli.helpers.ContractsReflections;
import io.keyko.nevermined.cli.helpers.Logger;
import io.keyko.nevermined.cli.models.CommandResult;
import picocli.CommandLine;

import java.util.Collection;
import java.util.concurrent.Callable;

@CommandLine.Command(
        name = "list",
        description = "List of Nevermined Contracts")
public class ContractList implements Callable {

    @CommandLine.ParentCommand
    NetworkCommand command;

    @CommandLine.Mixin
    Logger logger;

    CommandResult list() {

        try {
            command.printHeader("List of Nevermined Contracts:");

            Collection<Class> constructors = ContractsReflections.getConstructors();
            constructors.forEach(m -> {
                command.printItem("\t" + m.getSimpleName());
            });
        } catch (Exception e) {
            command.printError("Unable to retrieve contracts information");
            logger.debug(e.getMessage());
            return CommandResult.errorResult();
        } finally {
            command.cli.progressBar.doStop();
        }

        return CommandResult.successResult();

    }

    @Override
    public CommandResult call() {
        return list();
    }
}
