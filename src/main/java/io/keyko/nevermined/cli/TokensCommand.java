package io.keyko.nevermined.cli;

import io.keyko.nevermined.cli.modules.tokens.TokensRequest;
import io.keyko.nevermined.cli.modules.tokens.TokensTransfer;
import picocli.CommandLine;

@CommandLine.Command(
        name = "tokens",
        subcommands = {TokensRequest.class, TokensTransfer.class},
        description = "Allows to request Tokens and transfer to other accounts.")
public class TokensCommand extends NeverminedBaseCommand implements Runnable {

    @Override
    public void run() {
        spec.commandLine().usage(System.out);
    }
}
