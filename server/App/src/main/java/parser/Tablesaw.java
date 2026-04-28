package parser;

import java.io.FileWriter;
import java.io.IOException;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import tech.tablesaw.api.ColumnType;
import tech.tablesaw.api.Row;
import tech.tablesaw.api.Table;
import tech.tablesaw.io.DataFrameReader;
import tech.tablesaw.io.ReaderRegistry;
import tech.tablesaw.io.csv.CsvReadOptions;
import tech.tablesaw.io.csv.CsvWriteOptions;
import tech.tablesaw.selection.Selection;

public class Tablesaw {

//    public void test() throws InterruptedException {
//        final String fileName = "src/main/resources/keystrokes.csv";
//        Table dataframe = this.readFile(fileName);
//        this.printHeaders(dataframe);
//
//        List<String> keys = this.createKeys(dataframe);
//        System.out.println("\nUnique keys in file: " + keys.size());
//
//        long startTime = System.currentTimeMillis();
//        ArrayList<Thread> threads = new ArrayList<>();
//        for (String key : keys) {
//            Table selection = this.selectTask(dataframe, key);
//
//            @SuppressWarnings("preview")
//            Thread thread = Thread.startVirtualThread(new MyRunnable(selection, key));
//            threads.add(thread);
//        }
//
//        for (Thread thread : threads) {
//            thread.join();
//        }
//
//        long endTime = System.currentTimeMillis();
//
//        System.out.println("That took " + (endTime - startTime) + " milliseconds");
//    }

    public Table readFile(final String fileName) {
        ColumnType[] types = {
                ColumnType.STRING, // Key
                ColumnType.STRING, // EditType
                ColumnType.INTEGER, // SourceLocation
                ColumnType.STRING, // InsertText
                ColumnType.STRING, // DeleteText
                ColumnType.LONG, // ClientTimestamp
        };
        CsvReadOptions options = CsvReadOptions.builder(fileName)
                .maxCharsPerColumn(32768)
                .separator(',')
                .header(true)
                .columnTypes(types)
                .quoteChar('"')
                .missingValueIndicator("NaN")
                .build();

        return Table.read().usingOptions(options);
    }

    public Table readString(final String csvString) {
        Map<String, ColumnType> columnTypeMap = new HashMap<>();
        columnTypeMap.put("InsertText", ColumnType.STRING);
        columnTypeMap.put("DeleteText", ColumnType.STRING);
        CsvReadOptions options = CsvReadOptions.builder(new StringReader(csvString))
                .maxCharsPerColumn(32768)
                .separator(',')
                .header(true)
                .columnTypesPartial(columnTypeMap)
                .quoteChar('"')
                .missingValueIndicator("NaN")
                .build();


        return Table.read().usingOptions(options);
    }

    public Table readFileTest(final String fileName) {
        CsvReadOptions options = CsvReadOptions.builder(fileName)
                .maxCharsPerColumn(32678)
                .separator(',')
                .header(true)
                .quoteChar('"')
                .missingValueIndicator("NaN")
                .build();

        return Table.read().usingOptions(options);
    }

    public void writeFile(final Table dataframe, final String fileName) {
        CsvWriteOptions options = CsvWriteOptions.builder(fileName)
                .separator(',')
                .header(true)
                .quoteChar('"')
                .quoteAllFields(true) // needed? or just a bug?
                .build();
        dataframe.write().csv(options);
    }

    public void printHeaders(final Table dataframe) {
        System.out.println(dataframe.structure());
    }

    public void printRows(final Table dataframe) {
        System.out.println(dataframe.print());
    }

    public void printRows(final Table dataframe, final int rows) {
        System.out.println(dataframe.print(rows));
    }

    public List<String> createKeys(final Table dataframe) {
        ArrayList<String> keys = new ArrayList<>();

        for (Row row : dataframe) {
            final String key = row.getString("Key");
            if (!keys.contains(key))
                keys.add(key);
        }

        return keys;
    }

    public Table selectTask(final Table dataframe, final String subjectId, final String assignmentId,
            final String codeStateSection) {

        final String key = String.format("%s_%s_%s", subjectId, assignmentId, codeStateSection);
        return this.selectTask(dataframe, key);
    }

    public Table selectTask(final Table dataframe, final String key) {
        return dataframe.where(dataframe.stringColumn("Key").isEqualTo(key));
    }

//    public void test2() {
//        System.out.println(dataframe.columns.SubjectID);
//    }

}
