package parser;

import org.antlr.v4.runtime.ParserRuleContext;
import org.antlr.v4.runtime.tree.TerminalNode;
import parser.antlr.PythonParser;

import java.util.ArrayList;
import java.util.List;

public class MyVisitor {

    public static Node toSimpleTree(PythonParser.RootContext ctx, final String src) {
        // final int id = nextId();
        final String label = ctx.getClass().getSimpleName();
        final int startIndex = ctx.getStart().getStartIndex();
        final int stopIndex = ctx.getStop().getStopIndex();
        int length = stopIndex - startIndex + 1;

        // Trim whitespace
        while (length > 0 && Character.isWhitespace(src.charAt(startIndex + length-1)))
            length--;

//        if (length == 0) {
//            throw new RuntimeException("length reduced to zero in trimming");
//        }

        // skip EOFs
        if ("<EOF>".equals(ctx.getText())) {
//            return null;
            return new Node(Trees.NODE_TYPE_EMPTY, 0, src.length(), new ArrayList<>(), src, -1);
        }

        Node n = toSimpleTreeImpl(ctx, label, startIndex, length, src);
        n.setIsReference(true);
        return n;
    }

    private static Node toSimpleTreeImpl(ParserRuleContext tree,
                                         String parentLabel,
                                         int parentStartIndex,
                                         int parentLength,
                                         final String src) {

        List<Node> children = new ArrayList<>();

        for (int i = 0; i < tree.getChildCount(); i++) {

            if (tree.getChild(i) instanceof ParserRuleContext) {
                ParserRuleContext child = (ParserRuleContext) tree.getChild(i);
                final String childLabel = child.getClass().getSimpleName();
                final int childStartIndex = child.getStart().getStartIndex();
//                final int childStopIndex = child.getStop().getStopIndex();
                int childLength = child.getStop().getStopIndex() - childStartIndex + 1;

                // Trim whitespace
                while (Character.isWhitespace(src.charAt(childStartIndex + childLength-1)))
                    childLength--;

                final Node childNode = toSimpleTreeImpl(child, childLabel, childStartIndex,
                        childLength, src);
                children.add(childNode);
            } else {
                TerminalNode child = (TerminalNode) tree.getChild(i);

                // skip EOFs
                if ("<EOF>".equals(child.toString()) || "".equals(child.toString())) {
                    continue;
                }

                final String childLabel = "Terminal";
                int childStartIndex = child.getSymbol().getStartIndex();
                int childStopIndex = child.getSymbol().getStopIndex();

                // hack? TODO: investigate
                if (childStartIndex > childStopIndex) {
                    throw new RuntimeException("childStartIndex > childStopIndex: not sure what's going on here");
//                    childStartIndex = childStopIndex;
                }
                if (Character.isWhitespace(src.charAt(childStartIndex))) {
                    throw new RuntimeException("Starting with whitespace");
                }
                if (Character.isWhitespace(src.charAt(childStopIndex))) {
                    throw new RuntimeException("Ending with whitespace");
                }

                final Node childNode = new Node(childLabel, childStartIndex, child.toString().length(),
                        new ArrayList<>(), src);
                children.add(childNode);
            }
        }

        if (Character.isWhitespace(src.charAt(parentStartIndex))) {
            throw new RuntimeException("pStarting with whitespace");
        }
        if (Character.isWhitespace(src.charAt(parentStartIndex+parentLength-1))) {
            System.out.println(src.substring(parentStartIndex, parentStartIndex+parentLength));
            throw new RuntimeException("pEnding with whitespace");
        }
        return new Node(parentLabel, parentStartIndex, parentLength, children, src);
    }
}
