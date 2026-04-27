package parser;

import com.fasterxml.jackson.core.JsonGenerator;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


public class Trees {
    org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(Trees.class);

    public List<Node> trees;


    public static final String NODE_TYPE_UNCOMPILABLE = "UNCOMPILABLE";
    public static final String NODE_TYPE_NO_CHANGE = "NO_CHANGE";
    public static final String NODE_TYPE_EMPTY = "EMPTY";

    public static final Node NODE_UNCOMPILABLE = new Node(NODE_TYPE_UNCOMPILABLE, -1, -1, new ArrayList<>(), null, -1);
    public static final Node NODE_NO_CHANGE = new Node(NODE_TYPE_NO_CHANGE, -1, -1, new ArrayList<>(), null, -1);

    public Trees(List<Node> trees) {
        this.trees = trees;
    }

    public Trees() {
        this.trees = new ArrayList<>();
    }

    public void checkEqual(Trees reconTrees) {
        for (int i = 0; i < this.trees.size(); ++i) {
            Node a = this.trees.get(i);
            Node b = reconTrees.trees.get(i);
            if (a == null && b == null) {
                // Consider them equal
            } else if ((a==null&&b!=null) || (a!=null&&b==null) || !a.isEqual(b)) {
                Trees trees = new Trees();
                trees.add(this.trees.get(i));
                trees.add(reconTrees.trees.get(i));
                trees.outputGraphViz("output/not-equal.dot");
                throw new RuntimeException("Reconstructed tree at index " + i + " is incorrect.");
            }
        }
    }

    public void add(Node tree) {
        this.trees.add(tree);
    }

    /**
     * Recursively look through two trees, tparent and node, to find
     * @param tparent
     * @param node
     * @return
     */
    private static Node findChanged(Node tparent, Node node) {
        if (tparent.label.equals(Trees.NODE_TYPE_EMPTY) || node.label.equals(Trees.NODE_TYPE_EMPTY)) {
            return node;
        }

        Node changed = findTreeChanges(tparent, node);
        if (changed == Trees.NODE_UNCOMPILABLE) {
            return changed;
        }
        if (changed == null) {
            // The tree structure didn't change. We need to
            // check for anything that might have moved.
            changed = findWhitespaceChanges(tparent, node);
        }
        // Changed nodes must have a tparent unless one of the two nodes is empty
        if (changed != null) {
            while (changed != null && changed.tparent == null) {
                changed = changed.parent;
            }
        }
        // It is possible that the spacing between the changed node and the next
        // node changed. If it did, graduate the changed node to a common ancestor.
        // This is the only spacing we need to check since if other spacings changed
        // it will be caught in findTreeChanges.
        if (changed != null && changed.tparent.getNext() != null) {
            final int dist = changed.tparent.getNext().startIndex - changed.tparent.startIndex;
            final int dist2 = changed.getNext().startIndex - changed.startIndex;
            if (dist - changed.tparent.length != dist2 - changed.length) {
                changed = changed.getNext().parent;
            }
        }

        // Now check to see if any sibling nodes or their descendants lost a
        // tparent. This can happen when we're exiting a period of uncompilability
        // and a node was removed and re-added in that period. If one of these other
        // nodes lost a tparent then we need to move our changed node to a
        // common ancestor.
        if (changed != null) {
            Node curNode = changed;
            while (curNode != null) {
                List<Node> orphanedNodes = new ArrayList<>();
                for (Node s : curNode.getSiblings()) {
                    s.postOrder((Node d) -> {
                        if (d.tparent == null) {
                            orphanedNodes.add(d);
                        }
                    });
                }
                if (!orphanedNodes.isEmpty()) {
                    changed = curNode.parent;
                }
                curNode = curNode.parent;
            }
            while (changed != null && changed.tparent == null) {
                changed = changed.parent;
            }
        }

        return changed;
    }

    /**
     * Find structural changes to the tree, including changes in type of nodes, nodes being added
     * or removed, and leaf nodes changing (e.g., identifier changes).
     * @param tparent
     * @param node
     * @return
     */
    private static Node findTreeChanges(Node tparent, Node node) {
        if (tparent.children.size() == 0 || node.children.size() == 0) {
            // Leaf
            return node;
        }
        if (tparent.children.size() != node.children.size()) {
            // Leaf
            return node;
        }
        Node achanged = null;
        Node bchanged = null;
        for (int i = 0; i < tparent.children.size(); ++i) {
            Node achild = tparent.children.get(i);
            Node bchild = node.children.get(i);
            if (achild != bchild.tparent) return node;
            if (!achild.getSource().equals(bchild.getSource())) {
                if (achanged == null) {
                    achanged = achild;
                    bchanged = bchild;
                } else {
                    // multiple children have changed
                    return node;
                }
            }
        }
        if (achanged == null) {
            // No children changed. This is possible when the whitespace between children
            // changes. It will be caught later in findWhitespaceChanges.
            // TODO: should this return node?
            return node;
        }
        return findTreeChanges(achanged, bchanged);
    }

    // Finds offset differences in nodes. These are whitespace changes *between* tokens.
    // Whitespace changes inside nodes (e.g., in a string) will be reflected in findTreeChanges().
    private static Node findWhitespaceChanges(Node a, Node b) {
        if (!a.label.equals(b.label)) {
            throw new RuntimeException(String.format("No labels should have changed in findStartChangedImpl: %s (%d), %s (%d)",
                    a.label, a.id, b.label, b.id));
        }
        if (a.label.equals("Terminal")) {
            if (!a.getSource().equals(b.getSource())) {
                throw new RuntimeException("No labels should have changed in findStartChangedImpl");
            }
        }
        Node changed = null;
        for (int i = 0; i < a.children.size(); ++i) {
            changed = findWhitespaceChanges(a.children.get(i), b.children.get(i));
            if (changed != null) {
                return changed;
            }
        }
        if (a.startIndex != b.startIndex) {
            return b;
        }
        return null;
    }

    public void prune() {
        for (Node tree : trees) {
            pruneRecursive(tree);
        }
    }

    private void pruneRecursive(Node node) {
        if (node.children.isEmpty()) return;
        for (int i = 0; i < node.children.size(); i++) {
            pruneRecursive(node.children.get(i));
        }
        for (int i = 0; i < node.children.size(); i++) {
            Node child = node.children.get(i);
            if (child.children.size() == 1) {
                if (child.children.get(0).prunedParent == null) {
                    child.children.get(0).prunedParent = child;
                }
                child.children.get(0).parent = node;
                node.children.set(i, child.children.get(0));
            }
        }
    }

//    public void prune() {
//        List<Node> prunedTrees = new ArrayList<>();
//        int start = 0;
//        while (trees.get(start) == null) {
//            prunedTrees.add(null);
//            start += 1;
//        }
//        if (start < trees.size()) {
//            Node reference = trees.get(start);
//            reference.setIsReference(true);
//            prunedTrees.add(reference);
//
//            int tparenti = start;
//            for (int i = start; i < trees.size() - 1; ++i) {
//                int previ = i;
//                int curi = i + 1;
//                System.out.println("prune: " + i);
//                Node tparent = trees.get(previ);
//                // If the tparent is null (uncompilable), then use the last
//                // compilable snapshot.
//                if (tparent != Trees.NODE_UNCOMPILABLE) {
//                    tparenti = previ;
//                } else {
//                    tparent = trees.get(tparenti);
//                }
//                Node node = trees.get(curi);
//                if (node != null) {
//                    Node changed = findChanged(tparent, node);
//                    if (node.label.equals(NODE_TYPE_EMPTY)) {
//                        changed = node;
//                    }
//                    // TODO: changed may be null! One way this can happen is to cut code
//                    // to cause an incompilable state and then paste it back.
//                    if (changed == null) {
//                        prunedTrees.add(Trees.NODE_NO_CHANGE);
//                    } else {
////                        changed.computeNextStartIndex();
//                        prunedTrees.add(changed);
//                    }
//                } else {
//                    prunedTrees.add(Trees.NODE_UNCOMPILABLE);
//                }
//            }
//        }
//        this.trees = prunedTrees;
//    }
//
//    public Trees reconstructFromPruned() {
//        List<Node> prunedTrees = this.trees;
//        List<Node> reconTrees = new ArrayList<>();
//        for (int i = 0; i < prunedTrees.size(); ++i) {
//            Node pruned = prunedTrees.get(i);
//            logger.info("Reconstructing pruned tree " + i);
////            System.out.println("Reconstructing pruned tree " + i);
//            if (pruned.label.equals(Trees.NODE_TYPE_UNCOMPILABLE) || pruned.label.equals(Trees.NODE_TYPE_EMPTY)) {
//                reconTrees.add(pruned);
//            } else if (pruned.isReference()) {
//                reconTrees.add(pruned);
//            } else {
//                // Find the last reconstructed tree
//                int j = 1;
//                Node ref = Trees.NODE_UNCOMPILABLE;
//                while (ref == Trees.NODE_UNCOMPILABLE) {
//                    ref = reconTrees.get(reconTrees.size() - j);
//                    j++;
//                }
//                Node copy = new Node(ref);
//                if (!pruned.label.equals(Trees.NODE_TYPE_NO_CHANGE)) {
//                    copy.replace(pruned);
//                }
//                copy.resetIds(ref.getId() + 1);
//                reconTrees.add(copy);
//            }
//        }
//        return new Trees(reconTrees);
//    }

    public void outputGraphViz(String fn) {
        outputGraphViz(trees, fn);
    }

    public static void outputGraphViz(List<Node> trees, String fn) {
        StringBuffer buf = new StringBuffer();
//        System.out.println("digraph G {");
        buf.append("digraph G {\n");
        for (int i = 0; i < trees.size(); ++i) {
            Node tree = trees.get(i);
            if (tree != null) {
                buf.append(tree.toDot(String.format("t%d_", i))+"\n");
            } else {
                buf.append(String.format("null%d [label = null]\n", i));
            }
        }
        buf.append("}\n");

        FileWriter myWriter = null;
        try {
            myWriter = new FileWriter(fn);
            myWriter.write(buf.toString());
            myWriter.close();
            System.out.println("Successfully wrote to " + fn);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private static JSONArray listNumberArray(int max) {
        JSONArray res = new JSONArray();
        for (int i = 0; i < max; i++) {
            res.put(String.valueOf(i));
        }
        return res;
    }

    public void outputJSON() {
        JSONObject json = new JSONObject();
        JSONArray jsonChildren = new JSONArray();
        for (Node child : trees) {
            jsonChildren.put(child.toJSON());
        }

        JSONObject object = jsonChildren.toJSONObject(listNumberArray(jsonChildren.length()));
        json.put("trees", object);

        System.out.println(json);
    }

    public JSONObject getJSON(String key) {
        JSONObject json = new JSONObject();
        JSONArray jsonChildren = new JSONArray();
        for (Node child : trees) {
            jsonChildren.put(child.toJSON());
        }

        json.put(key, jsonChildren);

        return json;
    }



}
