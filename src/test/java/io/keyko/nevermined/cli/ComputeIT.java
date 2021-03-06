package io.keyko.nevermined.cli;

import org.junit.Ignore;
import org.junit.Test;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

import static org.junit.Assert.assertEquals;

public class ComputeIT {

    @Test
    public void flinkExampleE2E() throws Exception {
        Process process = Runtime.getRuntime().exec("src/test/resources/examples/flink-demo.sh");
        InputStream stream = process.getInputStream();
        InputStreamReader streamReader = new InputStreamReader(stream);
        BufferedReader reader = new BufferedReader(streamReader);

        String line = null;
        while ((line = reader.readLine()) != null) {
            if (line.length() > 1) {
                System.out.println(line);
            }
        }
        int returnCode = process.waitFor();
        assertEquals(0, returnCode);
    }

    // TODO: This test hangs in the CI. Check https://github.com/nevermined-io/cli/issues/18
    @Ignore
    @Test
    public void FLExampleE2E() throws Exception {
        Process process = Runtime.getRuntime().exec("src/test/resources/examples/fl-demo.sh");
        InputStream stream = process.getInputStream();
        InputStreamReader streamReader = new InputStreamReader(stream);
        BufferedReader reader = new BufferedReader(streamReader);

        String line = null;
        while ((line = reader.readLine()) != null) {
            if (line.length() > 1) {
                System.out.println(line);
            }
        }
        int returnCode = process.waitFor();
        assertEquals(0, returnCode);
    }
}
