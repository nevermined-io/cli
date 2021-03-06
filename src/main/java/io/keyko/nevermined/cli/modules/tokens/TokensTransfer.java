package io.keyko.nevermined.cli.modules.tokens;

import io.keyko.nevermined.cli.TokensCommand;
import io.keyko.nevermined.cli.models.CommandResult;
import io.keyko.nevermined.cli.models.exceptions.CLIException;
import io.keyko.nevermined.exceptions.EthereumException;
import picocli.CommandLine;

import java.math.BigInteger;
import java.util.concurrent.Callable;

import static io.keyko.nevermined.cli.helpers.Constants.TRANSACTION_SUCCESS;

@CommandLine.Command(
        name = "transfer",
        description = "Tokens transfer between accounts")
public class TokensTransfer implements Callable {

    @CommandLine.ParentCommand
    TokensCommand command;

    @CommandLine.Mixin
    io.keyko.nevermined.cli.helpers.Logger logger;

    @CommandLine.Parameters(index = "0")
    String receiverAddress;

    @CommandLine.Parameters(index = "1")
    BigInteger drops;

    CommandResult transfer() throws CLIException {
        try {
            command.printHeader("Tokens transfer between accounts:");
            command.println("Transferring " + drops.longValue() +
                    " Token drops from " + command.cli.getNeverminedAPI().getMainAccount().getAddress() +
                    " to " + receiverAddress);

            command.cli.progressBar.start();

            String status= command.cli.getNeverminedAPI().getTokensAPI()
                    .transfer(receiverAddress, drops)
                    .getStatus();

            if (status.equals(TRANSACTION_SUCCESS))
                command.printSuccess();

        } catch (EthereumException e) {
            command.printError("Error during token request");
            logger.debug(e.getMessage());
            return CommandResult.errorResult();
        } finally {
            command.cli.progressBar.doStop();
        }
        return CommandResult.successResult();    }

    @Override
    public CommandResult call() throws CLIException {
        return transfer();
    }
}
