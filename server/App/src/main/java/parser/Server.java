package parser;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.json.JSONObject;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tech.tablesaw.api.IntColumn;
import tech.tablesaw.api.Table;

import java.io.IOException;
import java.io.StringWriter;
import java.util.regex.Pattern;

@CrossOrigin(origins = "*")
@RestController
public class Server {

    @GetMapping("/")
    public ResponseEntity<String> index() {
        System.out.println("recieved");
        return ResponseEntity.ok("Success");

    }

//    @PostMapping("/buildTrees")
//    public ResponseEntity<String> buildTrees(@RequestBody String csvString) {
//        JSONObject response;
//        try {
//            var ts = new Tablesaw();
//
//            csvString = csvString.substring(9, csvString.length() - 2);
////            System.out.println(csvString);
//            csvString = csvString.replaceAll(Pattern.quote("\\r\\n"), "\r\n");
//            csvString = csvString.replaceAll(Pattern.quote("\\\""), "\"");
//            csvString = csvString.replaceAll(Pattern.quote("\\n"), "\n");
//            csvString = csvString.replaceAll(Pattern.quote("\\t"), "\t");
//            csvString = csvString.replaceAll(Pattern.quote("\\\\"), "\\\\");
//
//
//
//            Table df = ts.readString(csvString);
//
////            for (int i = 0; i < df.rowCount(); i++) {
////                System.out.println(df.row(i));
////            }
//
//            Reconstruction reconstruction = new Reconstruction(df);
////            Trees trees = new Trees(reconstruction.trees);
//            Trees trees = new Trees(reconstruction.derivedTrees);
////            Trees trees = new Trees(new ArrayList<>(reconstruction.derivedTrees.subList(1, reconstruction.derivedTrees.size() - 1)));
//
////            trees.prune();
//
//
//            String key = String.format(
//                    "%s_%s_%s",
//                    df.row(0).getString("SubjectID"),
//                    df.row(0).getString("AssignmentID"),
//                    df.row(0).getString("CodeStateSection")
//            );
//            response = trees.getJSON(key);
//
//
//        } catch (Exception e) {
//            System.out.println("Failure");
//            System.out.println(e);
//            e.printStackTrace();
//            return ResponseEntity.internalServerError().build();
//        }
////        HttpHeaders headers = new HttpHeaders();
////        headers.add("Content-Type","application/json");
////        headers.add("Content-Encoding", "gzip")
////        return new ResponseEntity<String>(response.toString(), headers, HttpStatus.OK);
//        System.out.println("Sending response...");
//        System.out.println(response.toString());
//        return ResponseEntity.ok().body(response.toString());
////        return ResponseEntity.ok().body("");
//    }

    @PostMapping(value = "/buildTrees", produces = "application/json")
    public void buildTrees(
            @RequestBody String csvString,
            HttpServletResponse response
    ) throws IOException {

        response.setContentType("application/json");


        var ts = new Tablesaw();

        csvString = csvString.substring(9, csvString.length() - 2);
        csvString = csvString.replaceAll(Pattern.quote("\\r\\n"), "\r\n");
        csvString = csvString.replaceAll(Pattern.quote("\\\""), "\"");
        csvString = csvString.replaceAll(Pattern.quote("\\n"), "\n");
        csvString = csvString.replaceAll(Pattern.quote("\\t"), "\t");
        csvString = csvString.replaceAll(Pattern.quote("\\\\"), "\\\\");

        Table df = ts.readString(csvString);
        df.intColumn("SourceLocation").setMissingTo(0);

        if (!df.containsColumn("X-Compilable")) {
//            long start = System.currentTimeMillis();
            IntColumn compilableColumn = PythonSyntaxValidator.validateAllStates(df);
            df.addColumns(compilableColumn);
//            long end = System.currentTimeMillis();
//            System.out.println("Time taken: " + (end - start) + "ms");

//            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CSV is missing required column: X-Compilable");
        };

        Reconstruction reconstruction = new Reconstruction(df);
        Trees trees = new Trees(reconstruction.derivedTrees);

        String key = String.format(
                "%s_%s_%s",
                df.row(0).getString("SubjectID"),
                df.row(0).getString("AssignmentID"),
                df.row(0).getString("CodeStateSection")
        );

        JsonGenerator gen = new ObjectMapper()
                .getFactory()
                .createGenerator(response.getOutputStream());

        gen.writeStartObject();
        gen.writeFieldName(key);
        gen.writeStartArray();

        for (Node child : trees.trees) {
            child.writeJson(gen);
        }

        gen.writeEndArray();
        gen.writeEndObject();
        gen.flush();


    }

}
