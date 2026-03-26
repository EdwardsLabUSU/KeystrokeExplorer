package parser;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.antlr.v4.runtime.ANTLRErrorListener;
import org.antlr.v4.runtime.BailErrorStrategy;
import org.antlr.v4.runtime.CharStream;
import org.antlr.v4.runtime.CharStreams;
import org.antlr.v4.runtime.CommonTokenStream;
import org.antlr.v4.runtime.RecognitionException;
import org.antlr.v4.runtime.misc.ParseCancellationException;

import parser.antlr.PythonLexer;
import parser.antlr.PythonParser;
import parser.antlr.PythonParser.RootContext;

public final class Parser {
    private Parser() {
        createTree("x: int = 1"); // warmup
    }

    public static RootContext createTreeFromFile(String fn) throws IOException {
        final String content = new String(Files.readAllBytes(Paths.get(fn)));
        return createTree(content);
    }

    public static RootContext createTree(String input) throws ParseCancellationException {
        CharStream in = CharStreams.fromString(input);
        PythonLexer lexer = new PythonLexer(in);
        CommonTokenStream tokens = new CommonTokenStream(lexer);
        PythonParser parser = new PythonParser(tokens);

        lexer.removeErrorListeners();
        parser.removeErrorListeners();
        lexer.addErrorListener(new ParserErrorListener());
        parser.addErrorListener(new ParserErrorListener());

        parser.setBuildParseTree(true);
        return parser.root();
    }
}
