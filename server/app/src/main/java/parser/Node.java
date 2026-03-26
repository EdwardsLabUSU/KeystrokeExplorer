package parser;

import com.fasterxml.jackson.core.JsonGenerator;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * IDs are set depth-first from left to right (in order of children).
 */
public class Node {
    public interface Visitor {
        void visit(Node n);
    }

    private static int _nextId = 0;

    private static int nextId() {
        return _nextId++;
    }

    public Node tparent = null;
    public Node tchild = null;

    // dparent and dchild are for temporal relations between derived trees
    public Node dparent = null;
    public Node dchild = null;

    public int numInserts = 0;
    public int numDeletes = 0;

    public int id;
    public final String label;
    public int startIndex;
    public int length;
    public final List<Node> children;
    public Node parent = null;
    public Node prunedParent = null;
//    public int tparentId = -1;
    public boolean reference = false;

    public boolean isTransient = false;
    public boolean newTransient = false;
    public boolean interiorTransient = false;
    public boolean changed = false;
    public boolean newChanged = false;
    public boolean derived = false;
    public boolean childrenChanged = false;
    public boolean newChildrenChanged = false;
    public boolean moved = false;

    public boolean failure = false;

//    general use boolean for any analysis tasks needing to mark nodes
    public boolean flagForAnalysis = false;

    public int state;

    private final String text;

    private final String src;

    public String task;

    /**
     * BASE_NODE: copies a node, sets the original node as the temporal parent
     * INSERT_NODE: copies a node, sets the original node as the temporal children
     * EXACT: exact copy of every trait
     */
    public enum CopyType {
        BASE_NODE,
        INSERT_NODE,
        EXACT
    }
    // The starting character index of the next node. This is used in
    // pruning and reconstruction.
//    public int nextStartIndex = -1;

    public Node(String label, int startIndex, int length, List<Node> children, String src) {
        this.id = nextId();
        this.label = label;

//        if (startIndex > endIndex || endIndex-startIndex+1 != length) {
//            throw new RuntimeException("Unexpected start/end indices");
//        }
        this.startIndex = startIndex;
        this.length = length;
        this.children = new ArrayList<>(children);
        String text = null;
        if (Objects.equals(label, "Terminal")) {
            try {
                text = src.substring(startIndex, startIndex+length);
            } catch (Exception e) {
                System.out.println(e);
            }
        }
        this.text = text;
        this.src = src;

        for (Node child : this.children) {
            child.parent = this;
        }
    }

    public Node(String label, int startIndex, int length, List<Node> children, String src, int state) {
        this.id = nextId();
        this.label = label;

        this.state = state;
//        if (startIndex > endIndex || endIndex-startIndex+1 != length) {
//            throw new RuntimeException("Unexpected start/end indices");
//        }
        this.startIndex = startIndex;
        this.length = length;
        this.children = new ArrayList<>(children);
        String text = null;
        if (Objects.equals(label, "Terminal")) {
            try {
                text = src.substring(startIndex, startIndex+length);
            } catch (Exception e) {
                System.out.println(e);
            }
        }
        this.text = text;
        this.src = src;

        for (Node child : this.children) {
            child.parent = this;
        }
    }

    /**
     * Warning: this copies the ids over as well.
     *
     * @param copy
     */
    public Node(Node copy) {
        this.id = copy.id;
        this.label = copy.label;
        this.startIndex = copy.startIndex;
        this.length = copy.length;
        this.children = new ArrayList<>();
        this.text = copy.text;
        this.src = null;
        this.tparent = copy;

        for (Node child : copy.children) {
            Node newChild = new Node(child);
            this.children.add(newChild);
            newChild.parent = this;
        }
    }

    public Node(Node copy, CopyType copyType, int charIdx, int state) {
        this.id = copy.id;
        this.label = copy.label;
        this.startIndex = copy.startIndex;
        this.length = copy.length;
        this.children = new ArrayList<>();
        this.text = copy.text;
        this.src = null;
        this.tparent = copy;
        this.moved = copy.moved;
        this.state = state;

        this.derived = copy.derived;
        if (charIdx > 0) {
            this.childrenChanged = copy.childrenChanged;
            this.newChildrenChanged = copy.newChildrenChanged;
            this.changed = copy.changed;
            this.newChanged = copy.newChanged;
            this.isTransient = copy.isTransient;
            this.newTransient = copy.newTransient;
            this.interiorTransient = copy.interiorTransient;
        } else {
            this.childrenChanged = copy.childrenChanged || copy.newChildrenChanged;
            this.changed = copy.changed || copy.newChanged;
            this.isTransient = copy.isTransient || copy.newTransient;
        }

        if (copyType == CopyType.BASE_NODE) {
            this.dchild = copy.dchild != null ? copy.dchild : copy.tchild;
            this.dparent = copy;
            this.tchild = copy.tchild;
        } else if (copyType == CopyType.INSERT_NODE) {
            this.dchild = copy;
            this.tchild = copy;
            this.dparent = copy.dparent == null ? copy.tparent : copy.dparent;
            this.tparent = copy.tparent;
        } else if (copyType == CopyType.EXACT) {
            this.dchild = copy.dchild;
            this.dparent = copy.dparent;
            this.tparent = copy;
            this.tchild = copy.tchild;
        }


        if (copyType == CopyType.BASE_NODE){
            while (this.tparent != null && this.tparent.state == this.state) {
                this.tparent = this.tparent.tparent;
            }
            while (this.dparent != null && this.dparent.state == this.state) {
                this.dparent = this.dparent.dparent;
            }
            if (this.dparent != null) {
                this.dparent.dchild = this;
            }
        }


        for (Node child : copy.children) {
            Node newChild = new Node(child, copyType, charIdx, state);
            this.children.add(newChild);
            newChild.parent = this;
        }
    }

    public boolean isEqual(Node node) {
        if (this == node)
            return true;
        boolean e = (id == node.id && startIndex == node.startIndex && length == node.length &&
                getTparentId() == node.getTparentId() && Objects.equals(label, node.label));
        if (!e) {
            System.out.println("not equal: "+node.id);
            return false;
        }
        for (int i = 0; i < children.size(); ++i) {
            if (!children.get(i).isEqual(node.children.get(i))) {
                System.out.println("not equal: "+node.id);
                return false;
            }
        }
        return true;
    }

    public String getSource() {
        return this.src.substring(startIndex, startIndex+length);
    }

    /**
     * Post-order traversal
     * @param visitor
     */
    public void postOrder(Visitor visitor) {
        for (Node child:children) {
            child.postOrder(visitor);
        }
        visitor.visit(this);
    }

    /**
     * Visits all nodes that have a start index strictly
     * after the end index of this. So, the parent of this
     * is not included, but siblings that come after this
     * are included.
     * @param visitor
     */
    public void strictlyAfter(Visitor visitor) {
        if (parent == null) {
            return;
        }
        int i = parent.children.indexOf(this)+1;
        for (; i < parent.children.size(); ++i) {
            parent.children.get(i).postOrder(visitor);
        }
        parent.strictlyAfter(visitor);
    }

    public List<Node> getSiblings() {
        List<Node> siblings = new ArrayList<>();
        Node parent = this.parent;
        if (parent == null) return siblings;
        for (Node n:parent.children) {
            if (n != this)
                siblings.add(n);
        }
        return siblings;
    }

    /**
     * Returns a list of nodes in depth-first order.
     * @return
     */
    public List<Node> getDepthFirst() {
        List<Node> nodes = new ArrayList<>();
        postOrder((Node n) -> {nodes.add(n);});
        return nodes;
    }

    public Node find(int id) {
        List<Node> nodes = new ArrayList<>();
        postOrder((Node n) -> {
           if (n.id == id) {
               nodes.add(n);
           }
        });
        if (nodes.isEmpty()) return null;
        if (nodes.size() == 1) {
            return nodes.get(0);
        }
        throw new RuntimeException("Multiple nodes with id " + id);
    }

    // Iterates through each node and ensures that if each node has
    // a temporal parent, it exists in the tparentTree.
    public void checkTParents(final Node tparentTree) {
        postOrder((Node n) -> {
            final int tp = n.getTparentId();
            if (tp != -1) {
                if (tparentTree.find(tp) == null) {
                    throw new RuntimeException(String.format("%d not found in tree", tp));
                }
            }
        });
    }

    public int getEndInclusiveIndex() {
        return this.startIndex + this.length - 1;
    }

    public void resetIds(int startId) {
        int id = startId;
        resetIdsImpl(id);
    }

    public void resetIds() {
        int id = nextId();
        id = resetIdsImpl(id);
        _nextId = id + 1;
    }

    private int resetIdsImpl(int id) {
        for (Node child : children) {
            id = child.resetIdsImpl(id);
        }
        this.id = id;
        return id + 1;
    }

    public void replace(Node replacement) {
        if (replacement.getTparentId() == id) {
            throw new RuntimeException("Unexpectedly trying to replace the root.");
        }
        replaceImpl(replacement, null);
    }

    private class ReplacementResult {
        /**
         * How much the start index changed for the node being replaced.
         */
        public final int startOffset;
        /**
         * How much the length changed for the node being replaced.
         */
        public final int lengthOffset;
        /**
         * How much subsequent nodes need to update their start offset by.
         */
        public final int offset;
        public ReplacementResult(int startOffset, int lengthOffset) {
//            if (startOffset != 0 && lengthOffset != 0) {
//                throw new RuntimeException("length and startIndex both unexpectedly changed");
//            }
//            if (startOffset == 0 && lengthOffset == 0) {
//                throw new RuntimeException("nothing unexpectedly changed");
//            }

            this.startOffset = startOffset;
            this.lengthOffset = lengthOffset;
            this.offset = startOffset + lengthOffset;
        }
    }

    private ReplacementResult replaceImpl(Node replacement, ReplacementResult result) {
        if (result != null) {
            // A node ahead of this changed. Update the offset.
            this.startIndex += result.offset;
            for (Node child:children) {
                child.replaceImpl(replacement, result);
            }
        } else {
            boolean firstChild = false;
            for (int i = 0; i < children.size(); ++i) {
                Node child = children.get(i);
                if (replacement.getTparentId() == child.id) {
                    // We found the node to replace. Do the replacement.
                    children.set(i, replacement);
                    replacement.parent = this;

                    result = new ReplacementResult(replacement.startIndex - child.startIndex,
                            replacement.length - child.length);
                } else {
                    result = child.replaceImpl(replacement, result);
                }
                if (result != null && i == 0) {
                    firstChild = true;
                }
            }
            // Changes from unrolling
            if (result != null) {
                if (firstChild && result.startOffset != 0) {
                    // If the start offset of our first child changed then update our start offset.
                    this.startIndex += result.startOffset;
                    this.length += result.lengthOffset;
                } else {
                    this.length += result.offset;
                    result = new ReplacementResult(0, result.offset);
                }
            }
        }
        return result;
    }

    public void editLength(Node editNode, int changeBy) {
//        if (editNode.id == id) {
//            throw new RuntimeException("Unexpectedly trying to edit the root.");
//        }
        editLengthImpl(editNode, changeBy, null);
    }

    private ReplacementResult editLengthImpl(Node editNode, int changeBy, ReplacementResult result) {
        if (result != null) {
            this.startIndex += result.offset;
            for (Node child: children) {
                child.editLengthImpl(editNode, changeBy, result);
            }
        } else {
            boolean firstChild = false;
//            List<Node> toRemove = new ArrayList<Node>();
            for (int i = 0; i < children.size(); i++) {
                Node child = children.get(i);
                if (editNode.id == child.id) {
                    // We found the node to edit,
                    child.length += changeBy;
//                    if (child.length <= 0) {
//                        toRemove.add(child);
//                    }

                    result = new ReplacementResult(editNode.startIndex - child.startIndex,
                            editNode.length - child.length + changeBy);
                } else {
                    result = child.editLengthImpl(editNode, changeBy, result);
                }
                if (result != null && i == 0) {
                    firstChild = true;
                }
            }
//            if (!toRemove.isEmpty()) {
//                children.removeAll(toRemove);
//            }
            if (result != null) {
                if (firstChild && result.startOffset != 0) {
                    // If the start offset of our first child changed then update our start offset.
                    this.startIndex += result.startOffset;
                    this.length += result.lengthOffset;
                } else {
                    this.length += result.offset;
                    result = new ReplacementResult(0, result.offset);
                }
            }
        }
        return result;
    }

    public void editStartIndex(Node editNode, int changeBy) {
        editStartIndexImpl(editNode, changeBy, null);
    }

    private ReplacementResult editStartIndexImpl(Node editNode, int changeBy, ReplacementResult result) {
        if (result != null) {
            this.startIndex += result.offset;
            for (Node child: children) {
                child.editStartIndexImpl(editNode, changeBy, result);
            }
        } else {
            boolean firstChild = false;
//            List<Node> toRemove = new ArrayList<Node>();
            for (int i = 0; i < children.size(); i++) {
                Node child = children.get(i);
                if (editNode.id == child.id) {
                    // We found the node to edit,
                    child.startIndex += changeBy;

                    result = new ReplacementResult(editNode.startIndex - child.startIndex + changeBy,
                            editNode.length - child.length);
                } else {
                    result = child.editStartIndexImpl(editNode, changeBy, result);
                }
                if (result != null && i == 0) {
                    firstChild = true;
                }
            }
            if (result != null) {
                if (firstChild && result.startOffset != 0) {
                    // If the start offset of our first child changed then update our start offset.
                    this.startIndex += result.startOffset;
                    this.length += result.lengthOffset;
                } else {
                    this.length += result.offset;
                    result = new ReplacementResult(0, result.offset);
                }
            }
        }
        return result;
    }

    public Node getNext() {
        if (parent == null) {
            return null;
        }
        final int i = parent.children.indexOf(this);
        if (i < parent.children.size()-1) {
            return parent.children.get(i+1);
        }
        return parent.getNext();
    }

    public int getId() {
        return id;
    }

    public int getMinId() {
        if (this.children.isEmpty()) {
            return this.getId();
        } else {
            return this.children.get(0).getMinId();
        }
    }

    public Node getTparent() {
        return tparent;
    }

    public int getTparentId() {
//        return tparentId;
        return (tparent != null) ? tparent.getId() : -1;
    }

//    public void setTparent(Node tparent) {
//        this.tparent = tparent;
//    }

    public boolean getTransient() {
        return this.isTransient || this.newTransient;
    }

    public boolean isReference() {
        return this.reference;
    }

    public void setIsReference(boolean reference) {
        this.reference = reference;
    }

    public void traverse(Visitor visitor) {
        visitor.visit(this);
        for (Node child : this.children) {
            child.traverse(visitor);
        }
    }

    public void traversePostOrder(Visitor visitor) {
        for (Node child : this.children) {
            child.traverse(visitor);
        }
        visitor.visit(this);
    }

    public void setNewChanged() {
        Visitor warningVisiter = n -> {
            if (n.dparent == null || n.dparent.length != n.length) {
                n.newChanged = true;
            }
            if (n.dparent != null && (n.dparent.newChanged || n.dparent.changed)) {
                n.changed = true;
            }
            if (n.dparent != null && (n.dparent.childrenChanged || n.dparent.newChildrenChanged)) {
                n.childrenChanged = true;
            }
        };
        this.traverse(warningVisiter);
    }

    public void deleteEmpty() {
        Visitor deleteVisitor = n -> {
            List<Node> toRemove = new ArrayList<Node>();
            for (Node child : n.children) {
                if (child.length <= 0) {
                    toRemove.add(child);
                    if (child.dparent != null) {
                        child.dparent.dchild = null;
                    }
                }
            }
            if (!toRemove.isEmpty()) {
                n.children.removeAll(toRemove);
                n.childrenChanged = true;
            }
        };
        traverse(deleteVisitor);
    }

    public void updateIndices() {
        Visitor updateVisitor = n -> {
            if (n.children.isEmpty()) return;

            n.startIndex = n.children.get(0).startIndex;
            Node lastChild = n.children.get(n.children.size() - 1);
            n.length = (lastChild.startIndex + lastChild.length) - n.children.get(0).startIndex;
        };
        traversePostOrder(updateVisitor);
    }

    public void setDParents() {
        Visitor dParentVisitor = n -> {
            if (n.dchild != null){
                n.dchild.dparent = n;
            }
        };
        this.traverse(dParentVisitor);
    }

    public void setDChildren() {
        Visitor dChildrenVisitor = n -> {
            if (n.dparent != null){
                n.dparent.dchild = n;
            }
        };
        this.traverse(dChildrenVisitor);
    }

    public void removeDChildren() {
        Visitor dChildrenVisitor = n -> {
            n.dchild = null;
        };
        this.traverse(dChildrenVisitor);
    }

    public void setStates(int state) {
        Visitor stateVisitor = n -> {
            n.state = state;
        };
        this.traverse(stateVisitor);

    }

    public int getLeafNodeLocation(Node n) {
        AtomicInteger count = new AtomicInteger();
        AtomicInteger finalCount = new AtomicInteger(-1);
        boolean cont = false;
        postOrder((Node nd) -> {
            if (finalCount.get() != -1) {
                return;
            }
            if (nd.id == n.id) {
                finalCount.set(count.get());
            } else if (nd.children.isEmpty()) {
                count.getAndIncrement();
            }
        });

        return finalCount.get();
    }


//    public void computeNextStartIndex() {
//        Node n = getNext();
//        if (n != null) {
//            this.nextStartIndex = n.startIndex;
//        } else {
//            this.nextStartIndex = -1;
//        }
//    }

//    private int getSpaceBeforeNextNode() {
//        return (this.nextStartIndex-this.startIndex)-this.length;
//    }

    // -------------------------------------------------------
    // JSON
    // -------------------------------------------------------

    public JSONObject toJSON() {
        JSONObject json = new JSONObject();
        json.put("id", id);
        json.put("name", label);
        json.put("startIndex", startIndex);
        json.put("length", length);
        if (this.tparent != null) {
            json.put("tparent", this.tparent.id);
        }
        if (this.dparent != null) {
            json.put("dparent", this.dparent.id);
        }
        if (this.tchild != null) {
            json.put("tchild", this.tchild.id);
        }
        if (this.dchild != null) {
            json.put("dchild", this.dchild.id);
        }
        if (this.newTransient) {
            json.put("newTransient", true);
        } else if (this.isTransient || this.interiorTransient) {
            json.put("transient", true);
        }
        if (this.newChanged) {
            json.put("newChanged", true);
        } else if (this.changed) {
            json.put("changed", true);
        }
        if (this.derived) {
            json.put("derived", true);
        }
        if (this.newChildrenChanged) {
            json.put("newChildrenChanged", true);
        } else if (this.childrenChanged) {
            json.put("childrenChanged", true);
        }
        json.put("text", this.text);

        JSONArray jsonChildren = new JSONArray();
        for (Node child : children) {
            jsonChildren.put(child.toJSON());
        }

        json.put("children", jsonChildren);

        return json;
    }

    public void writeJson(JsonGenerator gen) throws IOException {
        gen.writeStartObject();

        gen.writeNumberField("id", id);
        gen.writeStringField("name", label);
        gen.writeNumberField("startIndex", startIndex);
        gen.writeNumberField("length", length);

        if (tparent != null) {
            gen.writeNumberField("tparent", tparent.id);
        }
        if (dparent != null) {
            gen.writeNumberField("dparent", dparent.id);
        }
        if (tchild != null) {
            gen.writeNumberField("tchild", tchild.id);
        }
        if (dchild != null) {
            gen.writeNumberField("dchild", dchild.id);
        }

        if (newTransient) {
            gen.writeBooleanField("newTransient", true);
        } else if (isTransient || interiorTransient) {
            gen.writeBooleanField("transient", true);
        }

        if (newChanged) {
            gen.writeBooleanField("newChanged", true);
        } else if (changed) {
            gen.writeBooleanField("changed", true);
        }

        if (derived) {
            gen.writeBooleanField("derived", true);
        }

        if (newChildrenChanged) {
            gen.writeBooleanField("newChildrenChanged", true);
        } else if (childrenChanged) {
            gen.writeBooleanField("childrenChanged", true);
        }

        gen.writeStringField("text", text);

        gen.writeFieldName("children");
        gen.writeStartArray();
        for (Node child : children) {
            child.writeJson(gen);   // recursive streaming
        }
        gen.writeEndArray();

        gen.writeEndObject();
    }


    private static JSONArray listNumberArray(int max) {
        JSONArray res = new JSONArray();
        for (int i = 0; i < max; i++) {
            res.put(String.valueOf(i));
        }
        return res;
    }

    // -------------------------------------------------------
    // GraphViz Dot
    // -------------------------------------------------------
    public String toDot() {
        return toDot("n");
    }

    public String toDot(String prefix) {
        StringBuffer buf = new StringBuffer();
        nodeToDot(buf, prefix);
        return buf.toString();
    }

    private void nodeToDot(StringBuffer buf, String prefix) {
//        String elabel = example = example.replaceAll("'", "\\\\'").replaceAll("\"", "\\\\\"");
        if (!Objects.equals(label, "Terminal")) {
            String elabel = label.replaceAll("\"", "\\\\\"");
            buf.append(
                    String.format("%s%d [label = \"%s\\n%d, %d-%d, tp=%d\"];\n", prefix, id, elabel, id, startIndex, getEndInclusiveIndex(), getTparentId()));
        } else {
            String etext = text.replaceAll("\"", "\\\\\"");
            buf.append(
                    String.format("%s%d [label = \"%s\\n%d, %d-%d, tp=%d\"];\n", prefix, id, etext, id, startIndex, getEndInclusiveIndex(), getTparentId()));
        }
        // if (this.tparent != null) {
        // buf.append(String.format("n%s->n%s [style=dashed]\n", this.id,
        // this.tparent.id));
        // }
        for (Node child : children) {
            child.nodeToDot(buf, prefix);
            buf.append(String.format("%s%s->%s%s;\n", prefix, id, prefix, child.id));
        }
    }

    public String toString() {
        return this.text != null ? this.text : this.label;
    }

    private String debugNode(String offset) {
        String reString = offset
                + "Label: `" + this.label + "`"
                + " | Name: `" + this.toString() + "`"
                + " | Start: " + this.startIndex
                + " | End: " + this.getEndInclusiveIndex()
                + " | Inserts: " + this.numInserts
                + " | Deletes: " + this.numDeletes;

        reString += " | tpid: ";
        if (this.tparent != null) {
            reString += tparent.id;
        } else {
            reString += "NaN";
        }

        reString += " | tchild: ";
        if (this.tchild != null) {
            reString += tchild.id;
        } else {
            reString += "NaN";
        }

        return reString;
    }

    private String debugTree(String offset) {
        String reString = this.debugNode(offset);

        for (Node child : children) {
            reString += "\n";
            reString += child.debugTree(offset + "  ");
        }

        return reString;
    }

    public String debugNode() {
        return debugNode("");
    }

    public String debugTree() {
        return debugTree("");
    }


    // Helper function for analysisMicroContextSwitch
    public void recursiveLeafNodeFlag() {
        if (this.flagForAnalysis) return;

        this.flagForAnalysis = true;

        if(this.tchild != null) {
            this.tchild.recursiveLeafNodeFlag();
        }
        if (this.dchild != null) {
            this.dchild.recursiveLeafNodeFlag();
        }

        if(this.tparent != null) {
            this.tparent.recursiveLeafNodeFlag();
        }
        if (this.dparent != null) {
            this.dparent.recursiveLeafNodeFlag();
        }
    }


}
