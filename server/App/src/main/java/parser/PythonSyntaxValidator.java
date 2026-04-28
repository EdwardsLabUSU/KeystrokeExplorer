package parser;

import org.python.core.CompileMode;
import org.python.core.ParserFacade;
import org.python.core.PySyntaxError;
import org.python.core.CompilerFlags;
import tech.tablesaw.api.IntColumn;
import tech.tablesaw.api.Row;
import tech.tablesaw.api.Table;

public class PythonSyntaxValidator {

    public static int isValid(String code) {
        try {
            ParserFacade.parse(code, CompileMode.exec, "<string>", new CompilerFlags());
            return 1;
        } catch (Exception e) {
            return 0;
        }
    }

    //    1 compilable, 0 not
    public static IntColumn validateAllStates(Table df) {
        IntColumn column = IntColumn.create("X-Compilable");

        String state = "";
        for (Row row : df) {
            int i = row.getInt("SourceLocation");
            String insertText = row.getString("InsertText");
            String deleteText = row.getString("DeleteText");

            final String lhs = state.substring(0, i);
            final String rhs = state.substring(i + deleteText.length());
            state = lhs + insertText + rhs;

            int compilable = PythonSyntaxValidator.isValid(state);

            column.append(compilable);
        }
        return column;
    }
}