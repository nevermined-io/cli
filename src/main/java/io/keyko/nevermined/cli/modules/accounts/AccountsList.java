package io.keyko.nevermined.cli.modules.accounts;

import io.keyko.nevermined.cli.AccountsCommand;
import io.keyko.nevermined.cli.helpers.Logger;
import io.keyko.nevermined.cli.models.CommandResult;
import io.keyko.nevermined.cli.models.exceptions.CLIException;
import io.keyko.nevermined.exceptions.EthereumException;
import io.keyko.nevermined.models.Account;
import picocli.CommandLine;

import java.util.List;
import java.util.concurrent.Callable;

@CommandLine.Command(
        name = "list",
        description = "List all the existing accounts")
public class AccountsList implements Callable {

    @CommandLine.ParentCommand
    AccountsCommand command;

    @CommandLine.Mixin
    Logger logger;


    CommandResult list() throws CLIException {
        command.printHeader("Listing Accounts:");

        List<Account> accounts;
        try {
            accounts= command.cli.getNeverminedAPI().getAccountsAPI().list();
        } catch (EthereumException | CLIException e) {
            command.printError("Unable to retrieve accounts info");
            logger.debug(e.getMessage());
            return CommandResult.errorResult();
        }

        for (Account account: accounts) {
            command.printItem(account.getAddress());
        }
        return CommandResult.successResult();
    }

    @Override
    public CommandResult call() throws CLIException {
        return list();
    }
}
