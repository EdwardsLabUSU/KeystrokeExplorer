package parser;

import java.io.FileWriter;
import java.io.IOException;

import tech.tablesaw.api.Table;

public class MyRunnable implements Runnable {
    Table dataframe;
    String key;

    public MyRunnable(Table dataframe, String key) {
        this.dataframe = dataframe;
        this.key = key;
    }

    public void run() {
        new Reconstruction(dataframe);
        try {
            FileWriter writer = new FileWriter("output/" + dataframe.rowCount() + "_" +
                    this.key + ".txt");
            writer.write(dataframe.rowCount() + "");
            writer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}