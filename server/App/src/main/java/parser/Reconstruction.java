package parser;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

import parser.antlr.PythonParser;
import tech.tablesaw.api.ColumnType;
import tech.tablesaw.api.Row;
import tech.tablesaw.api.Table;

public class Reconstruction {
    public int length;
    public int transientEdits = 0;
    public int lastTransientState;

    public List<Node> trees = new ArrayList<>();
    public List<Node> derivedTrees = new ArrayList<>();
//    public List<String> errors = new ArrayList<>();
    public List<String> codeStates = new ArrayList<>();

    public Table table;

    private TemporalHierarchy correspondance = new TemporalHierarchy();

    public double successRate;

    public Reconstruction(Table dataframe) {
        this.table = dataframe;
        this.reconstruct(dataframe);
        this.length = trees.size();

        // this.debug();
    }

    private void reconstruct(Table dataframe) {
        String label = this.table.row(0).getString("SubjectID") + "_" + this.table.row(0).getString("AssignmentID") + "_" + this.table.row(0).getString("CodeStateSection");
        System.out.printf("%s: %d%n", label, this.table.rowCount());
        String state = "";
        this.codeStates.add(state);
        this.createCorrespondance(0, state, "", true);

        int j = 0;
        for (Row row : dataframe) {
            j++;
            int i = row.getInt("SourceLocation");

            String insertText = row.getString("InsertText");
            String deleteText = row.getString("DeleteText");

            boolean compilable = row.getInt("X-Compilable") == 1;


//            if ("".equals(insertText) && "".equals(deleteText)) {
//                System.out.println("Insert and Delete are empty");
//                System.out.println(row.toString());
//                return;
//            }
//            System.out.println(j);
            final String lhs = state.substring(0, i);
            final String rhs = state.substring(i + deleteText.length());
            state = lhs + insertText + rhs;
            this.codeStates.add(state);

            this.createCorrespondance(i, insertText, deleteText, compilable);
        }

        this.trees.remove(0);
        this.codeStates.remove(0);
        this.correspondance.allCompilable.remove(0);
        this.correspondance.allIdxInLastSnapshot.remove(0);
        this.correspondance.allIdxInLastCompilable.remove(0);

        deriveAllTrees();

        int count = 0;
        int countFail = 0;
//        int i = 0;
        boolean prevFail = false;
        for (Node derivedTree : this.derivedTrees) {
            if (derivedTree.failure && !prevFail) {
                count++;
//                System.out.println(String.format("Failed at state %s", i));
            }
            if (derivedTree.failure) {
                countFail++;
                prevFail = true;
            }
            else {
                prevFail = false;
            }
//            i++;
        }
        this.successRate = Math.round((derivedTrees.size() - countFail) * 1.0 / (derivedTrees.size()) * 100 * 100) / 100.0;
//        System.out.println( Math.round((derivedTrees.size() - count) * 1.0 / (derivedTrees.size()) * 100 * 100) / 100.0 + "% success rate: (" + (derivedTrees.size() - count) + "/" + derivedTrees.size() + ")");
        System.out.println( Math.round((derivedTrees.size() - countFail) * 1.0 / (derivedTrees.size()) * 100 * 100) / 100.0 + "% of states with trees: (" + (derivedTrees.size() - countFail) + "/" + derivedTrees.size() + ")");
    }

    public static int numSnapshots = 0;
    private void createCorrespondance(int i, String insertText, String deleteText, boolean compilable) {
        String errorMessage = null;
        String src = codeStates.get(codeStates.size() - 1);
        Node tree = null;
        PythonParser.RootContext ctx = null;
        if (compilable) {
            try {
                ctx = Parser.createTree(src);
            } catch(Exception e) {
                // Trailing whitespace at end of file can cause parser to fail
                // If parsing failed, try again after stripping whitespace
                String[] splitSrc = src.split("\n", -1);
                String lastLine = splitSrc[splitSrc.length - 1];
                if (!lastLine.isEmpty() && lastLine.trim().isEmpty()) {
                    String partialSrc = src;
                    while (partialSrc.endsWith(" ")) {
                        partialSrc = partialSrc.substring(0, partialSrc.length() - 2);
                    }
                    try {
                        ctx = Parser.createTree(partialSrc);
                    } catch(Exception e2) {
                        tree = Trees.NODE_UNCOMPILABLE;
                    }
                } else {
                    tree = Trees.NODE_UNCOMPILABLE;
                }
            }
        } else {
            tree = Trees.NODE_UNCOMPILABLE;
        }

        if (ctx != null) {
            tree = MyVisitor.toSimpleTree(ctx, src);
        }
        numSnapshots++;

        if (tree == null) {
            throw new RuntimeException("Tree is null");
        }

        tree.setStates(this.trees.size() - 1);
        correspondance.allCompilable.add(tree != Trees.NODE_UNCOMPILABLE);
        correspondance.temporalCorrespondence(i, this.trees.size(), insertText, deleteText);
        if (tree != Trees.NODE_UNCOMPILABLE && !Objects.equals(tree.label, "EMPTY")) {
            correspondance.temporalHierarchy(tree, this.codeStates);
        }

        this.trees.add(tree);
    }

    public List<Node> getTidToNodes() {
        return this.correspondance.tidToNode;
    }

    public int size() {
        return this.length;
    }

    public void debug() {
        for (int i = 0; i < trees.size(); ++i) {
            final Node tree = this.trees.get(i);

            if (tree == null) {
                System.out.println("```\n" + this.codeStates.get(i) + "\n```");
//                System.out.println(this.errors.get(i));
                System.out.println("\n\n\n");
            } else {
                System.out.println("```\n" + this.codeStates.get(i) + "\n```");
                System.out.println(tree.debugTree());
                System.out.println("\n\n\n");
            }
        }
    }

    /**
     * Creates BPTs for all uncompilable states
     */
    public void deriveAllTrees() {
        String label = this.table.row(0).getString("SubjectID") + "_" + this.table.row(0).getString("AssignmentID") + "_" + this.table.row(0).getString("CodeStateSection");
//        System.out.printf("%s: %d%n", label, this.table.rowCount());
        for (int i = 0; i < trees.size(); i++) {
            Node node = trees.get(i);
            if (Objects.equals(node.label, "UNCOMPILABLE")) {
                if (getNextCompilable(i) == -1) {
                    derivedTrees.add(node);
                }
                else if (i != 0 && getLastCompilable(i) == -1) {
                    derivedTrees.add(node);
                }
                else if (i == 0 || !Objects.equals(derivedTrees.get(i - 1).label, "UNCOMPILABLE")){
                    try {
                        Node newTree = deriveTree(i);
                        newTree = checkForErrors(newTree, node, i, label);
//                        checkForErrors(newTree, node, i, label);
                        if (Objects.equals(newTree.label, "UNCOMPILABLE")) {
                            Node lastTree = derivedTrees.get(i-1);
                            lastTree.removeDChildren();
//                            derivedTrees.set(i-1)
                        }
                        this.derivedTrees.add(newTree);
//                        System.out.println("Constructed tree for state " + i);
                    } catch (Exception e) {
//                        System.out.println("Failed to construct tree for state " + i + " : " + e.getMessage());
                        node.derived = true;
                        node.failure = true;
                        this.derivedTrees.add(node);
                    }
                }
                else {
                    node.derived = true;
                    this.derivedTrees.add(node);
                }
            } else {
                this.derivedTrees.add(node);
            }
        }
    }

    private ArrayList<String> exceptions = new ArrayList<>(Arrays.asList("Student1_Assign8_task1.py", ""));

    /**
     * Checks all nodes in the BPT for any unexpected changes
     * @param root BPT root node for keystroke state
     * @param compiledRoot Parse tree root node
     * @param state keystroke state
     * @param label file label
     * @return
     */
    private Node checkForErrors(Node root, Node compiledRoot, int state, String label) {
        if (state == 0 || checkNodeForErrors(root, state) || exceptions.contains(label)) {
            return root;
        } else {
//            System.out.println("Failure found in state " + state);
            root.failure = true;
            compiledRoot.failure = true;
            return compiledRoot;
        }
    }

    /**
     * Checks node for an unexpected change, based on previous tree and whether the node should have changed this state
     * @return boolean, true if no errors found, false if errors
     */
    private boolean checkNodeForErrors(Node node, int state) {
        if (Objects.equals(node.label, "Terminal") && !node.getTransient() && !node.newChanged && node.dparent != null) {
            String code = this.codeStates.get(state);
            String lastCode = this.codeStates.get(state - 1);
            String nodeString;
            try {
                nodeString = code.substring(node.startIndex, node.startIndex + node.length);
            } catch (Exception e) {
                return false;
            }
            Node lastNode = node;
            Node lastTree = this.derivedTrees.get(state - 1);
            while (lastNode.id > lastTree.id && lastNode.dparent != null) {
                lastNode = lastNode.dparent;
            }
            if (lastNode.id > lastTree.id || lastNode.id < lastTree.getMinId()) {
                return true;
            }

            String lastNodeString = lastCode.substring(lastNode.startIndex, lastNode.startIndex + lastNode.length);
            if (!nodeString.equals(lastNodeString)) {
//                System.out.println(nodeString);
                return false;
            }
            return true;
        } else if (!node.children.isEmpty()) {
            for (Node child : node.children) {
                if (!checkNodeForErrors(child, state)) {
                    return false;
                }
            }
            return true;
        } else {
            return true;
        }
    }

    // helper function for deriveTree
    private Node deriveTree(int state) {
        int insertLength = table.row(state).getString("InsertText").length();
        int deleteLength = table.row(state).getString("DeleteText").length();
        return deriveTree(state, insertLength + deleteLength - 1, null);
    }

    /**
     * Create a BPT for
     * @param state
     * @param charIdx index of character in insertText / deleteText, used to account for pastes / cuts
     * @param previousNode only used for pastes / cuts, root node for previous charIdx
     * @return new BPT root node
     */
    private Node deriveTree(int state, int charIdx, Node previousNode) {
        int lastCompilable = getLastCompilable(state);
        int nextCompilable = getNextCompilable(state);

        int insertLength = table.row(state).getString("InsertText").length();
        int deleteLength = table.row(state).getString("DeleteText").length();

        int location = table.row(state).getInt("SourceLocation");
        if (insertLength > 0) {
            location += charIdx;
        } else {
            location += deleteLength - 1 - charIdx;
        }
        int editLength = insertLength > 0 ? 1 : -1;

        int idxInLastCompilable;
        int idxInLastState;
        // Edit is at the end of file
        if (location > correspondance.allIdxInLastCompilable.get(state).size() - 1) {
            idxInLastCompilable = location;
            idxInLastState = location;
        } else {
            idxInLastCompilable = correspondance.allIdxInLastCompilable.get(state).get(location);
            idxInLastState = correspondance.allIdxInLastSnapshot.get(state).get(location);
        }
        int idxInNextCompilable = getIdxInNextCompilable(state, location);

        Node nextTree = trees.get(nextCompilable);
        Node prevTree;
        if (state == 0) {
            prevTree = new Node("RootContext", 0, 0, new ArrayList<>(), "", state);
            nextTree.dparent = prevTree;
        } else if (previousNode != null) {
            prevTree = previousNode;
        } else if (charIdx > 0) {
//          handle pastes/cuts iteratively to avoid stack overflow errors
            for (int i = 0; i <= charIdx; i++) {
                previousNode = deriveTree(state, i, previousNode);
            }
            return previousNode;
        } else if (state - lastCompilable > 1) {
            prevTree = this.derivedTrees.get(state - 1);
        } else {
            prevTree = trees.get(lastCompilable);
        }

        if (Objects.equals(prevTree.label, "EMPTY")) {
            nextTree.dparent = prevTree;
        }

//        if (state == 282) {
//            System.out.println("pausing");
//        }


        // Edits don't exist in any compilable state, and thus are transient
        if (idxInLastCompilable == -1 && idxInNextCompilable == -1 && editLength > 0) {
            if (state != lastTransientState) {
                this.transientEdits++;
            }
            lastTransientState = state;

            Node copyPrev = new Node(prevTree, Node.CopyType.BASE_NODE, charIdx, state);

            // Find the lowest node that contains the transient edit
            Node insertAt = copyPrev;
            boolean continueSearch = true;
            if (copyPrev.startIndex + copyPrev.length > location) {
                while (!insertAt.children.isEmpty() && continueSearch) {
                    continueSearch = false;
                    for (Node child : insertAt.children) {
                        if ((child.startIndex < location
                                || (child.getTransient() && child.startIndex <= location)) // Check for existing transient node that edit fits with
                                && location < child.startIndex + child.length) {
                            insertAt = child;
                            continueSearch = true;
                            break;
                        }

                    }
                }
            }

            // If transient edit occurs in an existing node
            if ((Objects.equals(insertAt.label, "Terminal") || insertAt.getTransient() || insertAt.interiorTransient)) { //(insertLength == 1 || insertLength - 1 == charIdx) &&
                Node newTerminal = new Node("Terminal", insertAt.startIndex, insertAt.length + editLength, new ArrayList<>(), this.codeStates.get(state), state);
                if (insertAt.getTransient()) {
                    newTerminal.newTransient = true;
                } else {
                    newTerminal.interiorTransient = true;
                }
                newTerminal.dchild = getDOrTChild(insertAt, state, charIdx);
                newTerminal.tparent = insertAt;
                copyPrev.resetIds();
                copyPrev.replace(newTerminal);
                copyPrev.resetIds();
                newTerminal.tparent = null;
                copyPrev.derived = true;
                copyPrev.setDParents();
                copyPrev.deleteEmpty();
                return copyPrev;
            }
            else {
//                if (Objects.equals(insertAt.label, "Terminal") || insertAt.getTransient() || insertAt.interiorTransient) {
//                    insertAt = insertAt.parent;
//                }
                Node emptyNode = new Node("EMPTY", location, 0, new ArrayList<>(), "", state);
                Node transientNode = new Node("Terminal", location, editLength, new ArrayList<>(), this.codeStates.get(state), state);
                transientNode.newTransient = true;

                boolean added = false;
                // Find location in insertAt's children to add the transient edit
                for (int i = 0; i < insertAt.children.size(); i++) {
                    if (location <= insertAt.children.get(i).startIndex) {
                        // If edit occurs directly after an existing transient node, combine them
                        //TODO in a paste ending in transient, and followed by transient, the two won't be combined currently
                        if (i != 0) {
                            Node prevChild = insertAt.children.get(i - 1);
                            if (prevChild.getTransient() && location == prevChild.startIndex + prevChild.length) {
                                copyPrev.editLength(prevChild, editLength);
                                prevChild.newTransient = true;
                                copyPrev.resetIds();
                                copyPrev.derived = true;
                                copyPrev.setDParents();
                                return copyPrev;
                            }
                        }

                        // If edit occurs directly before an existing transient node, combine them
                        if (i != insertAt.children.size() - 1) {
                            Node nextChild = insertAt.children.get(i);
                            // TODO does this not work for a paste with multiple consecutive transient characters?
                            if (nextChild.getTransient() && location == nextChild.startIndex && (insertLength == 1 || insertLength - 1 == charIdx)) {
                                copyPrev.editLength(nextChild, editLength);
                                nextChild.newTransient = true;
                                copyPrev.resetIds();
                                copyPrev.derived = true;
                                copyPrev.setDParents();
                                return copyPrev;
                            }
                        }

                        // otherwise, add the empty node in, and continue on to replace it with the new transient node
                        insertAt.children.add(i, emptyNode);
                        added = true;
                        break;
                    }
                }
                // Transient edit occurs after all of insertAt's children
                if (!added) {
                    // If edit occurs directly before an existing transient node, combine them
                    if (!insertAt.children.isEmpty()) {
                        Node lastChild = insertAt.children.get(insertAt.children.size() - 1);
                        if (lastChild.getTransient() && location == lastChild.startIndex + lastChild.length) {
                            copyPrev.editLength(lastChild, editLength);
                            copyPrev.resetIds();
                            copyPrev.derived = true;
                            copyPrev.setDParents();
                            return copyPrev;
                        }
                    }
                    insertAt.children.add(emptyNode);
                }
                insertAt.newChildrenChanged = true;
                transientNode.tparent = emptyNode;

                copyPrev.resetIds();
                copyPrev.replace(transientNode);
                copyPrev.resetIds();
                transientNode.tparent = null;
                copyPrev.derived = true;
                copyPrev.setDParents();
                copyPrev.deleteEmpty();

                return copyPrev;
            }

        }
        // Edits that exist in a future state
        else if (idxInLastCompilable == -1 && editLength > 0) {
            int prevMaxId = prevTree.getId();
            int prevMinId = prevTree.getMinId();

            // Find node where edit took place in the next compilable tree
            Node copyPrev = new Node(prevTree, Node.CopyType.BASE_NODE, charIdx, state);
            Node nextNode = new Node(nextTree, Node.CopyType.INSERT_NODE, charIdx, state);

            boolean didChange = true;
            // TODO find better solution than attempting a find in case of tparent that doesn't point to the last state
            while (!nextNode.children.isEmpty() && didChange && getDOrTParent(nextNode, state, charIdx) != null && getDOrTParent(nextNode, state, charIdx).id <= prevMaxId && getDOrTParent(nextNode, state, charIdx).id >= prevMinId) {
                for (Node child : nextNode.children) {
                    didChange = false;
                    if (child.startIndex <= idxInNextCompilable && idxInNextCompilable < child.startIndex + child.length ) {
                        nextNode = child;
                        didChange = true;
                        break;
                    }
                }
            }

//            if (state == 745) {
//                System.out.println("pause");
//            }


            // Pull up nextNode to it's parent IF the edited node in the previous state has some characters both in and outside nextNode,
            // (fixes problems with trying to "split" a node)
            // TODO charIdx == 0 may cause to not work in some pastes that it should
            Node prevNode = null;
            Node testNext = null;
            if (getDOrTParent(nextNode, state, charIdx) != null) {
                prevNode = getDOrTParent(nextNode, state, charIdx);
                testNext = nextNode;
            } else if (nextNode.parent != null && getDOrTParent(nextNode.parent, state, charIdx) != null) {
                prevNode = getDOrTParent(nextNode.parent, state, charIdx);
                testNext = nextNode.parent;
            }
            Node testChild = prevNode;
            while (!testChild.children.isEmpty()) {
                if (testChild.children.size() > 1) {
                    prevNode = null;
                    break;
                }
                testChild = testChild.children.get(0);
            }

            boolean charIn = false;
            boolean charOut = false;
            if (prevNode != null && nextNode.parent != null && charIdx == 0) {
                for (int idx = prevNode.startIndex; idx < prevNode.startIndex + prevNode.length; idx++) {
                    int prevIdxInNext = getIdxInOtherState(prevNode.state, nextCompilable, idx);
                    if (prevIdxInNext != -1 && (prevIdxInNext < nextNode.startIndex || prevIdxInNext > nextNode.getEndInclusiveIndex())) {
                        charOut = true;
//                        break;
                    }
                    else if (prevIdxInNext != -1 && (prevIdxInNext >= nextNode.startIndex || prevIdxInNext < nextNode.getEndInclusiveIndex())) {
                        charIn = true;
//                        break;
                    }
                    if (charIn && charOut) {
                        nextNode = nextNode.parent;
                        break;
                    }
                }
            }

            // In case of a paste, check if edit was already handled by a previous char in the paste
            if (charIdx > 0 && nextNode.dparent != null && nextNode.dparent.newChanged) {
                return copyPrev;
            }

            Node root = nextNode;
            while (root.parent != null) {
                root = root.parent;
            }

            // Changes that occur inside an existing node (leaf or not)
            if (!didChange || (Objects.equals(nextNode.label, "Terminal") && getDOrTParent(nextNode, state, charIdx) != null && copyPrev.find(getDOrTParent(nextNode, state, charIdx).id) != null)) {
                Node insertAt = copyPrev.find(getDOrTParent(nextNode, state, charIdx).id);
                nextNode.tparent = insertAt;

                // replace insertAt with nextNode within copyPrev,
                copyPrev = replaceTree(copyPrev, nextNode, nextCompilable, state, charIdx);
                nextNode.parent = insertAt.parent;

                // if replace was more than a single leaf node, update replaced subtree to match changes of this state
                if (!didChange) {
                    Node nextNodeCopy = new Node(nextNode, Node.CopyType.EXACT, charIdx, state);
                    removeOldNodes(nextNode, state, nextCompilable, charIdx, location, prevMaxId, prevMinId);
                    keepTransientNodes(nextNode, nextNodeCopy, state, nextCompilable, charIdx, location, prevMaxId, prevMinId);
                    copyPrev.deleteEmpty();
                }

                nextNode.setNewChanged();
            }
            // Edit that changes tree structure
            else {
                Node copyTParent = copyPrev.find(getDOrTParent(nextNode.parent, state, charIdx).id);
                copyPrev = trimAndInsertTree(copyPrev, nextNode, copyTParent, nextCompilable, state, charIdx);
            }

            if (charIdx == insertLength + deleteLength - 1) {
                updateAllNodes(nextNode, root, location + charIdx, nextCompilable, state);
            } else {
                updateNodesBeforeEditLocation(nextNode, root, location + charIdx, nextCompilable, state);
            }
            copyPrev.resetIds();
            return copyPrev;
        }
        // Edits that existed only in a past state
        else if (idxInNextCompilable == -1 && editLength < 0) {
            Node copyPrev = new Node(prevTree, Node.CopyType.BASE_NODE, charIdx, state);
            Node editedNode = copyPrev;
            boolean didChange = true;
            while (!editedNode.children.isEmpty() && didChange) {
                didChange = false;
                for (Node child : editedNode.children) {
                    if (child.startIndex <= location && location < child.startIndex + child.length) {
                        editedNode = child;
                        didChange = true;
                        break;
                    }
                }
            }

            // delete edit is in a non leaf node
            if (!didChange) {
                copyPrev.resetIds();
                Node editedChild = editedNode.children.get(0);
                int foundIdx = -1;
                for (int i = 0; i < editedNode.children.size(); i++) {
                    editedChild = editedNode.children.get(i);
                    if (location < editedNode.children.get(i).startIndex) {
                        foundIdx = i;
                        break;
                    }
                }

                while (!editedChild.children.isEmpty()) {
                    editedChild = editedChild.children.get(0);
                }

                editedNode.newChildrenChanged = true;
                if (foundIdx == -1) {
                    copyPrev.editLength(editedNode, -1);
                } else {
                    copyPrev.editStartIndex(editedChild, -1);
                }

                copyPrev.derived = true;
                copyPrev.resetIds();
                copyPrev.setDParents();
                return copyPrev;
            }
            // delete edit is in a leaf node
            else if (Objects.equals(editedNode.label, "Terminal") || editedNode.children.isEmpty() || editedNode.getTransient()) {
                copyPrev.resetIds();
                copyPrev.editLength(editedNode, editLength);
                if (editedNode.length == 0) {
                    editedNode.parent.newChildrenChanged = true;
                    copyPrev.deleteEmpty();
                    Node editedParent = editedNode.parent;
                    while (editedParent.parent != null && editedParent.length == 0) {
                        editedParent = editedParent.parent;
                    }
                    editedParent.updateIndices();
                } else {
                    editedNode.setNewChanged();
                }
                copyPrev.derived = true;
                this.derivedTrees.get(editedNode.dparent.state).removeDChildren();
                copyPrev.setDChildren();
                copyPrev.setDParents();
                copyPrev.resetIds();
                return copyPrev;
            }

            // Is there another possibility? I don't think so...
            System.out.println("missed possible case in past state code");
            return Trees.NODE_UNCOMPILABLE;

        }
        // Shouldn't ever happen
        else {
            System.out.println("missed possible case when creating BPT");
            return Trees.NODE_UNCOMPILABLE;
        }
    }

    /**
     * Insert a new node into the tree and trim
     * @param baseCopy Root node of tree being inserted into
     * @param node node being inserted
     * @param insertEmptyAt node in baseCopy, will be parent of node
     * @param baseState state which baseCopy is copied from
     * @param currState current state
     * @param charIdx
     * @return
     */
    private Node trimAndInsertTree(Node baseCopy, Node node, Node insertEmptyAt, int baseState, int currState, int charIdx) {
        int nodeLength = node.length;
        int offset = 0;
        int offsetBeforeFirst = 0;
        int prevLocation = -1;
        int location;

        // trim baseCopy to remove characters that exist in currState
        for (int i = 0; i < nodeLength; i++) {
            // TODO is this not the wrong direction???
            if (getIdxInOtherState(baseState, currState, node.startIndex + i) != -1) {
                int currLocation = getIdxInOtherState(baseState, currState, node.startIndex + i);
                if (getIdxInOtherState(currState, currState - 1, currLocation) != -1) {
                    location = getIdxInOtherState(currState, currState - 1, currLocation) - offset;

                    Node editedNode = getNodeByLocation(baseCopy, location);
                    // Check if the node being updated no longer has any characters that correspond to it's tchild
                    if (editedNode.startIndex == location && getDOrTChild(editedNode, currState, charIdx) != null && editedNode.length > 1) {
                        int newStartIndex = editedNode.startIndex + offset + 1;
                        int newStartIndexInBase = getIdxInOtherState(currState - 1, baseState, newStartIndex);
                        if (newStartIndexInBase < getDOrTChild(editedNode, currState, charIdx).startIndex || newStartIndexInBase >= getDOrTChild(editedNode, currState, charIdx).startIndex + getDOrTChild(editedNode, currState, charIdx).length) {
                            // TODO update editedNode to find the new tchild if it exists
                            editedNode.tchild = null;
                            editedNode.dchild = null;
                        }

                    }

                    recursiveSubtract(baseCopy, baseCopy, location);
                    offset++;
                    if (offsetBeforeFirst == 0 && prevLocation != -1 && location - prevLocation > 1) {
                        offsetBeforeFirst = offset;
                    }
                    prevLocation = location;
                }
            }
        }

        // TODO implement for previous node as well
        // If has a following transient sibling, check if it should be moved or split
        Node nextNode = insertEmptyAt.getNext();
        if (nextNode != null && nextNode.getTransient() && nextNode.startIndex < getIdxInOtherState(baseState, currState, node.startIndex)) {
            Node emptyNode = new Node("EMPTY", nextNode.startIndex, 0, new ArrayList<>(), "", currState);
            boolean added = false;
            for (int i = 0; i < insertEmptyAt.children.size() - 1; i++) {
                Node child = insertEmptyAt.children.get(i);
                int childFirstExistingIndex = child.startIndex;
                while (getIdxInPrevSnapshot(currState, baseState, childFirstExistingIndex) == -1 && childFirstExistingIndex < child.startIndex + child.length) {
                    childFirstExistingIndex++;
                }
                int childLastExistingIndex = child.startIndex + child.length;
                while (getIdxInPrevSnapshot(currState, baseState, childLastExistingIndex) == -1 && childLastExistingIndex > child.startIndex) {
                    childLastExistingIndex--;
                }
                if (emptyNode.startIndex <= childFirstExistingIndex) {
                    insertEmptyAt.children.add(i, emptyNode);
                    added = true;
                    break;
                }
            }
            if (!added) {
                insertEmptyAt.children.add(emptyNode);
            }

            Node copyTransientStays = new Node(nextNode, Node.CopyType.EXACT, charIdx, currState);
            copyTransientStays.tparent = nextNode;
            Node copyTransientMoves = new Node(nextNode, Node.CopyType.EXACT, charIdx, currState);
            copyTransientMoves.parent = insertEmptyAt;
            copyTransientMoves.tparent = emptyNode;

            for (int i = nextNode.startIndex; i < nextNode.startIndex + nextNode.length; i++) {
                if (i < getIdxInOtherState(baseState, currState, node.startIndex)) {
                    copyTransientStays.length -= 1;
                } else {
                    copyTransientMoves.length -= 1;
                }
            }

            baseCopy.replace(copyTransientStays);
            baseCopy.replace(copyTransientMoves);
        }

        insertEmptyAt.deleteEmpty();
        insertEmptyChild(insertEmptyAt, node, currState, getNextCompilable(currState));
        insertEmptyAt.newChildrenChanged = true;

        Node copyNextSibling = null;
        // move any nodes inside insertEmptyAt that should be
        if (insertEmptyAt.children.indexOf(node.tparent) < insertEmptyAt.children.size() - 1) {
            Node nextSibling = insertEmptyAt.children.get(insertEmptyAt.children.indexOf(node.tparent) + 1);
            // find last character in node that exists in currState
            int lastExistingIndex = node.startIndex + node.length;
            while (getIdxInPrevSnapshot(currState, baseState, lastExistingIndex) == -1 && lastExistingIndex > node.startIndex) {
                lastExistingIndex--;
            }
            if (nextSibling != null && nextSibling.startIndex + offsetBeforeFirst < getIdxInOtherState(baseState, currState - 1, lastExistingIndex)) {
                Node insertSiblingAt = node;
                boolean keepSearching = true;
                while (keepSearching) {
                    for (Node child : insertSiblingAt.children) {
                        int childFirstExistingIndex = child.startIndex;
                        while (getIdxInPrevSnapshot(currState, baseState, childFirstExistingIndex) == -1 && childFirstExistingIndex < child.startIndex + child.length) {
                            childFirstExistingIndex++;
                        }
                        int childLastExistingIndex = child.startIndex + child.length;
                        while (getIdxInPrevSnapshot(currState, baseState, childLastExistingIndex) == -1 && childLastExistingIndex > child.startIndex) {
                            childLastExistingIndex--;
                        }
                        if (insertSiblingAt.length > 0 && nextSibling.startIndex + offsetBeforeFirst > childFirstExistingIndex && nextSibling.getEndInclusiveIndex() + offsetBeforeFirst < childLastExistingIndex) {
                            insertSiblingAt = child;
                            break;
                        }
                        keepSearching = false;
                    }
                    if (insertSiblingAt.children.isEmpty()) {
                        keepSearching = false;
                    }
                }

                Node nextRoot = node;
                while (nextRoot.parent != null) {
                    nextRoot = nextRoot.parent;
                }

                if ((nextSibling.dchild != null && nextRoot.find(nextSibling.dchild.id) != null && nextSibling.dchild.startIndex <= insertSiblingAt.getEndInclusiveIndex())
                        || (nextSibling.length > 0 && nextSibling.tchild == null && nextSibling.dchild == null)) {
                    nextSibling.parent = insertSiblingAt;

                    Node emptyNode = new Node("EMPTY", nextSibling.startIndex + offsetBeforeFirst, 0, new ArrayList<>(), "", currState);
                    boolean added = false;
                    for (int i = 0; i < insertSiblingAt.children.size() - 1; i++) {
                        Node child = insertSiblingAt.children.get(i);
                        int childFirstExistingIndex = child.startIndex;
                        while (getIdxInPrevSnapshot(currState, baseState, childFirstExistingIndex) == -1 && childFirstExistingIndex < child.startIndex + child.length) {
                            childFirstExistingIndex++;
                        }
                        int childLastExistingIndex = child.startIndex + child.length;
                        while (getIdxInPrevSnapshot(currState, baseState, childLastExistingIndex) == -1 && childLastExistingIndex > child.startIndex) {
                            childLastExistingIndex--;
                        }
                        if (emptyNode.startIndex <= childFirstExistingIndex) {
                            insertSiblingAt.children.add(i, emptyNode);
                            added = true;
                            break;
                        }
                    }
                    if (!added) {
                        insertSiblingAt.children.add(emptyNode);
                    }

                    emptyNode.parent = insertSiblingAt;
                    copyNextSibling = new Node(nextSibling, Node.CopyType.EXACT, charIdx, currState);
                    copyNextSibling.moved = true;
                    copyNextSibling.tparent = emptyNode;
                    copyNextSibling.deleteEmpty();

                    int indexOfCopyNextSibling = insertSiblingAt.children.indexOf(emptyNode);
                    if (indexOfCopyNextSibling != 0 && emptyNode.startIndex <= insertSiblingAt.children.get(indexOfCopyNextSibling - 1).getEndInclusiveIndex()) {
                        emptyNode.startIndex = emptyNode.startIndex + (insertSiblingAt.children.get(indexOfCopyNextSibling - 1).getEndInclusiveIndex() - emptyNode.startIndex + 1);
                    }

                    Node editNode = copyNextSibling;
                    while (!editNode.children.isEmpty()) {
                        editNode = editNode.children.get(0);
                    }
                    if (editNode.id == copyNextSibling.id) {
                        copyNextSibling.startIndex = emptyNode.startIndex;
                    } else {
                        copyNextSibling.editStartIndex(editNode, emptyNode.startIndex - copyNextSibling.startIndex);
                    }

                    baseCopy.editLength(nextSibling, -nextSibling.length);
                    insertEmptyAt.children.remove(nextSibling);
                }
            }
        }



        trimAndReplaceTree(baseCopy, node, baseState, currState, charIdx, 0);

        if (insertEmptyAt.getEndInclusiveIndex() < node.getEndInclusiveIndex()) {
            insertEmptyAt.updateIndices();
        }
        node.setNewChanged();

        if (copyNextSibling != null && copyNextSibling.length > 0) {
            Node root = copyNextSibling.tparent;
            while (root.parent != null) {
                root = root.parent;
            }
            Node editNode = copyNextSibling;
            while (!editNode.children.isEmpty()) {
                editNode = editNode.children.get(0);
            }
            // update copyNextSibling startIndex so replace doesn't mess up lengths.
            baseCopy.replace(copyNextSibling);
            if (copyNextSibling.startIndex != copyNextSibling.tparent.startIndex) {
                baseCopy.editStartIndex(editNode,  copyNextSibling.tparent.startIndex - copyNextSibling.startIndex);
            }
            baseCopy.resetIds();
        }
        baseCopy.deleteEmpty();




        return baseCopy;
    }

    /**
     * Insert a new node into a tree by replacing an existing node, and trim
     * @param baseCopy base tree which will have a subtree replaced by node
     * @param node new node
     * @param baseState state of baseCopy
     * @param currState BPT state
     * @param charIdx
     * @return
     */
    private Node replaceTree(Node baseCopy, Node node, int baseState, int currState, int charIdx) {
        int nodeLength = node.length;
        int origStartIndex = node.startIndex;
        int offset = 0;
        // TODO this fix doesn't get applied if node is rootContext (e.g. baseCopy will get set to node, overwriting changes in baseCopy)
        for (int i = 0; i < nodeLength; i++) {
            if (getIdxInOtherState(baseState, currState, node.startIndex + i) != -1) {
                int currLocation = getIdxInOtherState(baseState, currState, node.startIndex + i);
                if (getIdxInOtherState(currState, currState - 1, currLocation) != -1) {
                    int location = getIdxInOtherState(currState, currState - 1, currLocation) - offset;

                    int insertLocation = table.row(currState).getInt("SourceLocation") + charIdx;
                    if (insertLocation < currLocation) {
                        location += charIdx;
                    }
                    if (node.tparent.startIndex > location || node.tparent.startIndex + node.tparent.length <= location) {
                        recursiveSubtract(baseCopy, baseCopy, location);
                        offset++;
                    }
                }
            }
        }


        Node nextRoot = node;
        while (nextRoot.parent != null) {
            nextRoot = nextRoot.parent;
        }
        Node editNode = node;
        while (!editNode.children.isEmpty()) {
            editNode = editNode.children.get(0);
        }

        int editLocation = table.row(currState).getInt("SourceLocation");
        int insertLength = table.row(currState).getString("InsertText").length();
        int locationInNext = getIdxInOtherState(currState, baseState, editLocation + charIdx);
        Node nodeInNext = getNodeByLocation(nextRoot, locationInNext);
        int firstExistingOrigStartIndex = nodeInNext.startIndex;
        while (getIdxInPrevSnapshot(currState, baseState, firstExistingOrigStartIndex) == -1 && firstExistingOrigStartIndex < nodeInNext.startIndex + nodeInNext.length) {
            firstExistingOrigStartIndex++;
//            System.out.println(currState + " increasing index in replaceTree");
        }

        // find first character in newChild that exists in targetState
        int firstExistingIndex = node.startIndex;
        while (getIdxInPrevSnapshot(currState, baseState, firstExistingIndex) == -1 && firstExistingIndex < node.startIndex + node.length) {
            firstExistingIndex++;
//            System.out.println(currState + " increasing index in replaceTree");
        }
        // Shouldn't ever happen
        if (firstExistingIndex >= node.startIndex + node.length) {
            throw new RuntimeException("Node being inserted has no correspondence to current state");
        }

        baseCopy = trimAndReplaceTree(baseCopy, node, baseState, currState, charIdx, 0);
        baseCopy.deleteEmpty();
        int changeby;
        if (getIdxInOtherState(baseState, currState, firstExistingOrigStartIndex) != -1) {
            changeby = getIdxInOtherState(baseState, currState, firstExistingOrigStartIndex) - nodeInNext.startIndex;
        } else {
            changeby = 0;
        }
        nextRoot.editStartIndex(nodeInNext, changeby);

//        if (firstExistingOrigStartIndex != getIdxInOtherState(baseState, currState, firstExistingOrigStartIndex) && node.startIndex != getIdxInOtherState(baseState, currState, firstExistingOrigStartIndex)) {
//            baseCopy.editStartIndex(nodeInNext, getIdxInOtherState(baseState, currState, firstExistingOrigStartIndex) - nodeInNext.startIndex );
//        }


        node.setNewChanged();

        return baseCopy;
    }

    private int trimTreeHelper(Node baseCopy, Node node, int baseState, int currState, int offset) {
        int editLength = 0;
        if (Objects.equals(node.label, "Terminal")) {
            for (int i = 0; i < node.length; i++) {
                if (getIdxInOtherState(baseState, currState, node.startIndex + i - offset) == -1) {
                    editLength--;
                }
            }
            if (editLength != 0) {
                baseCopy.editLength(node, editLength);
                offset += editLength;
            }
        } else {
            List<Node> toRemove = new ArrayList<Node>();

            int index = node.startIndex;
            for (Node child : node.children) {
                if (index < child.startIndex) {
                    for (int i = 0; i < child.startIndex - index; i++) {
                        if (getIdxInOtherState(baseState, currState, index + i - offset) == -1) {
                            editLength--;
                        }
                    }
                }
                if (editLength != 0) {
                    Node editNode = child;
                    while (!editNode.children.isEmpty()) {
                        editNode = editNode.children.get(0);
                    }
                    baseCopy.editStartIndex(editNode, editLength);
                    offset += editLength;
                }
                offset = trimTreeHelper(baseCopy, child, baseState, currState, offset);
                index = child.startIndex + child.length;
                if (child.length <= 0 && !Objects.equals(child.label, "EMPTY")) {
                    toRemove.add(child);
                }
                editLength = 0;
            }
            if (index < node.startIndex + node.length) {
                for (int i = 0; i < node.startIndex + node.length - index; i++) {
                    if (getIdxInOtherState(baseState, currState, index + i - offset) == -1) {
                        editLength--;
                    }
                }
            }

            if (!toRemove.isEmpty()) {
                node.children.removeAll(toRemove);
                node.newChildrenChanged = true;
            }
            if (editLength != 0) {
                baseCopy.editLength(node, editLength);
                offset += editLength;
            }
        }
        return offset;
    }

    /**
     * Replaces a node in baseCopy with node
     * Used by replaceTree and trimAndInsertTree functions
     * @param baseCopy
     * @param node
     * @param baseState
     * @param currState
     * @param charIdx
     * @param changeBy
     * @return
     */
    private Node trimAndReplaceTree(Node baseCopy, Node node, int baseState, int currState, int charIdx, int changeBy) {
        int origStartIndex = node.tparent.startIndex;

        if (node.dparent != null) {
            node.dparent.removeDChildren();
        }
        if (node.tparent.id == baseCopy.id) {
            baseCopy = node;
        } else {
            baseCopy.replace(node);
        }
        baseCopy.resetIds();
        node.setDChildren();
//        baseCopy.deleteEmpty();

        int offset = trimTreeHelper(baseCopy, node, baseState, currState, changeBy);

//         Updated inserted node's startIndex if it is needed
//        if (charIdx == 0) {
//            if (node.startIndex != getIdxInOtherState(baseState, currState, origStartIndex - changeBy + offset)) {
            if (node.startIndex != getIdxInOtherState(baseState, currState, origStartIndex - changeBy)) {

                    //        if (node.startIndex != origStartIndex) {
                Node firstChild = node;
                while (!firstChild.children.isEmpty()) {
                    firstChild = firstChild.children.get(0);
                }
                if (getIdxInOtherState(baseState, currState, node.startIndex) != -1) {
                    baseCopy.editStartIndex(firstChild, getIdxInOtherState(baseState, currState, node.startIndex) - node.startIndex);
                } else {
                    baseCopy.editStartIndex(firstChild, origStartIndex - node.startIndex);
                }
            }

//        }


        List<Node> toRemove = new ArrayList<Node>();
        if (node.parent != null) {
            for (Node child : node.parent.children) {
                if (child.length <= 0) {
                    toRemove.add(child);
                }
            }
        }
        if (!toRemove.isEmpty()) {
            node.parent.children.removeAll(toRemove);
            node.parent.newChildrenChanged = true;
//            node.updateIndices();

        }

        node.tparent = null;
        baseCopy.setDParents();
        baseCopy.derived = true;
        return baseCopy;
    }

    private void removeOldNodes(Node node, int currState, int baseState, int charIdx, int editLocation, int prevMaxId, int prevMinId) {
        Node traversing = node.dparent;
        if (node.dparent == null || node.dparent.getId() > prevMaxId || node.dparent.getId() < prevMinId) return;

        Node prevRoot = traversing;
        while (prevRoot.parent != null) {
            prevRoot = prevRoot.parent;
        }
        Node root = node;
        while (root.parent != null) {
            root = root.parent;
        }
        int deleteOffset = 0;
        for (int i = traversing.startIndex; i < traversing.startIndex + traversing.length; i++) {
            Node foundNode = getNodeByLocation(prevRoot, i);
            while (foundNode.parent != null) {
                if ((foundNode.getTransient() && Objects.equals(foundNode.label, "Terminal")) || (foundNode.dchild == null && foundNode.tchild == null)) {
                    // TODO This change might cause other problems, watch out
                    int insertLength = table.row(currState).getString("InsertText").length();
                    int locationInNextComp;
                    if (editLocation < i) {
                        locationInNextComp = getIdxInOtherState(currState, baseState, i + insertLength) - deleteOffset;
                    } else {
                        locationInNextComp = getIdxInOtherState(currState, baseState, i) - deleteOffset;
                    }
                    if (locationInNextComp + deleteOffset < 0) {
                        deleteOffset ++;
                        break;
                    }

                    int locationInNext = getIdxInOtherState(foundNode.state, currState, i) - deleteOffset;
//                    if (editLocation < i) {
//                        locationInNext = getIdxInOtherState(currState-1, currState, i + insertLength) - deleteOffset;
//                    } else {
//                        locationInNext = getIdxInOtherState(currState-1, currState, i) - deleteOffset;
//                    }

                    Node removeNode = getNodeByLocation(root, locationInNext);
                    if (!removeNode.children.isEmpty() && locationInNext < removeNode.children.get(removeNode.children.size() - 1).startIndex) {
                        boolean found = false;
                        for (Node child : removeNode.children) {
                            if (locationInNext < child.startIndex) {
                                child.startIndex = child.startIndex -1;
                            }
                        }
                    }
                    root.editLength(removeNode, -1);
                    deleteOffset+=2;
//                    root.deleteEmpty();
                    break;

                }
                if (foundNode.id == traversing.id) {
                    break;
                }
                foundNode = foundNode.parent;

            }



        }
    }

    private void keepTransientNodes(Node node, Node nodeCopy, int currState, int baseState, int charIdx, int editLocation, int prevMaxId, int prevMinId) {
        Node traversing = nodeCopy.dparent;

        if (nodeCopy.dparent == null || nodeCopy.dparent.getId() > prevMaxId || nodeCopy.dparent.getId() < prevMinId) {
            for (Node child : nodeCopy.children) {
                keepTransientNodes(child.tparent, child, currState, baseState, charIdx, editLocation, prevMaxId, prevMinId);
            }
            return;
        }

        // TODO this needs to be an in order traversal?
        // switching to breadth first search might sometimes cause infinite loops by adding nodes that will that trigger adding it again, but I might've fixed it, be warned...
//        for (Node child : nodeCopy.children) {
//            keepTransientNodes(child.tparent, child, currState, baseState, charIdx, editLocation, prevMaxId, prevMinId);
//        }

        Node root = node;
        while (root.parent != null) {
            root = root.parent;
        }

        for (int i = 0; i < traversing.children.size(); i++) {
            Node child = traversing.children.get(i);
            // reinsert any nodes from previous tree that were removed because they're not in the used section of the next tree
            if ((child.getTransient() && Objects.equals(child.label, "Terminal")) || (child.dchild == null && child.tchild == null) || child.moved) {
//            if ((child.getTransient() && Objects.equals(child.label, "Terminal"))) {

                Node childCopy = new Node(child, Node.CopyType.BASE_NODE, charIdx, currState);
                int insertLength = table.row(currState).getString("InsertText").length();
                int offset = insertLength - 1 - charIdx;
                int location;
                if (editLocation <= childCopy.startIndex) {
                    // offset is broken because some characters after this one might have already been inserted in a paste
                    location = getIdxInOtherState(currState - 1, currState, childCopy.startIndex - charIdx);
                } else {
                    location = childCopy.startIndex;
                }

//                childCopy.startIndex = location;
                Node emptyNode = new Node("EMPTY", location, 0, new ArrayList<>(), "", currState);
                boolean added = false;
                for (int j = 0; j < node.children.size(); j++) {
                    if (emptyNode.startIndex <= node.children.get(j).startIndex) {
                        node.children.add(j, emptyNode);
                        added = true;
                        break;
                    }
                }
                if (!added) {
                    node.children.add(emptyNode);
                    if (emptyNode.startIndex > node.startIndex + node.length) {
                        root.editLength(node, emptyNode.startIndex - (node.startIndex + node.length));
                    }
                }
                emptyNode.parent = node;
                childCopy.tparent = emptyNode;

//                insertEmptyChild(node, childCopy, currState, baseState);


                // update start index of inserted node's first child
                if (!childCopy.children.isEmpty() && childCopy.startIndex != emptyNode.startIndex) {
                    Node firstChild = childCopy;
                    while (!firstChild.children.isEmpty()) {
                        firstChild = firstChild.children.get(0);
                    }
                    childCopy.editStartIndex(firstChild, emptyNode.startIndex - childCopy.startIndex);
                } else if (childCopy.startIndex != emptyNode.startIndex) {
                    childCopy.startIndex = location;
                }
//
//                int removingOffset = 0;
//                for (int j = childCopy.length - 1; j >= 0; j--) {
////                    if (getIdxInOtherState(currState, baseState, location + j) != -1) {
//                        Node removeNode = getNodeByLocation(root, location + j -removingOffset);
//                        root.editLength(removeNode, -1);
////                        removingOffset++;
////                    }
//
//                }

                root.replace(childCopy);
            }
        }
        // reinsert any whitespace between nodes that is in prevTree but was removed because it isn't in the next tree
        for (int i = 0; i < traversing.children.size(); i++) {
            Node child = traversing.children.get(i);
            int nextNonWhitespace = i == traversing.children.size() - 1 ? traversing.startIndex + traversing.length : traversing.children.get(i + 1).startIndex;
            int offset = 0;
            for (int spaceIndex = child.startIndex + child.length; spaceIndex < nextNonWhitespace; spaceIndex++) {
                if (getIdxInOtherState(child.state, currState, spaceIndex) != -1 && getIdxInOtherState(child.state, baseState, spaceIndex) == -1) {
                    if (i == traversing.children.size() - 1) {
                        root.editLength(node, 1);
                        offset++;
                    } else {
                        int nextNodeStart = traversing.children.get(i + 1).startIndex;
                        Node editNode;
                        if (spaceIndex <= editLocation && charIdx < table.row(currState).getString("InsertText").length() - 1) {
                            editNode = getNodeByLocation(root, getIdxInOtherState(child.state, currState, nextNodeStart) + offset);
                        } else {
                            // TODO might break in pastes if not whole insertText has been implemented yet
                            int insertLength = table.row(currState).getString("InsertText").length();
                            editNode = getNodeByLocation(root, getIdxInOtherState(child.state, currState, nextNodeStart) + offset - insertLength);
                        }
                        if (editNode != null) {
                            while (!editNode.children.isEmpty()) {
                                editNode = editNode.children.get(0);
                            }
                            // ensure not reinserting white space that was accounted for when reinserting multiple sibling nodes
                            if (editNode.dparent != null && !(getIdxInOtherState(editNode.dparent.state, currState, editNode.dparent.startIndex) == editNode.startIndex)) {
                                root.editStartIndex(editNode, 1);
                                offset++;
                            }
                        } else {
                            System.out.println("When reinserting whitespace, editNode's dchild was null");
                        }
                    }
                }
            }
        }
        // switching to breadth first search might sometimes cause infinite loops by adding nodes that will that trigger adding it again, but I might've fixed it, be warned...
        for (Node child : nodeCopy.children) {
            keepTransientNodes(child.tparent, child, currState, baseState, charIdx, editLocation, prevMaxId, prevMinId);
        }

    }

    private void recursiveSubtract(Node node, Node root, int location) {
        if (Objects.equals(node.label, "Terminal")) {
            root.editLength(node, -1);
            node.newChanged = true;
        } else {
            boolean nodeFound = false;
            for (Node child : node.children) {
                if (child.startIndex <= location && child.startIndex + child.length > location) {
                    recursiveSubtract(child, root, location);
                    nodeFound = true;
                    break;
                } else if (child.startIndex > location) {
                    Node firstChild = child;
                    while (!firstChild.children.isEmpty()) {
                        firstChild = firstChild.children.get(0);
                    }
                    root.editStartIndex(firstChild, -1);
                    nodeFound = true;
                    break;
                }
            }
            if (!nodeFound) {
                root.editLength(node, -1);
            }
        }
    }

    private void updateNodesBeforeEditLocation(Node n, Node root, int editLocation, int baseState, int currState) {
        if (Objects.equals(n.label, "Terminal")) {
            if (n.dparent != null && n.startIndex != n.dparent.startIndex && n.dchild != null && getIdxInOtherState(baseState, currState, n.dchild.startIndex) != n.startIndex) {
                if (editLocation < n.startIndex) {
                    root.editStartIndex(n, n.dparent.startIndex - n.startIndex + 1);
                } else {
//                    if (currState != 1892) {
                        root.editStartIndex(n, n.dparent.startIndex - n.startIndex);
//                    }
                }
            }
        } else {
            for (Node child: n.children) {
                if (child.startIndex < editLocation && !child.moved) {
                    updateNodesBeforeEditLocation(child, root, editLocation, baseState, currState);
                }
            }
        }
    }

    private void updateAllNodes(Node n, Node root, int editLocation, int baseState, int currState) {
        if (Objects.equals(n.label, "Terminal")) {
            if (n.dparent != null && n.startIndex != n.dparent.startIndex && n.dchild != null && getIdxInOtherState(baseState, currState, n.dchild.startIndex) != n.startIndex) {
                if (editLocation < n.startIndex) {
                    root.editStartIndex(n, n.dparent.startIndex - n.startIndex + 1);
                } else {
                    root.editStartIndex(n, n.dparent.startIndex - n.startIndex);

                }
            }
        } else {
            for (Node child: n.children) {
                if (!child.moved) {
                    updateNodesBeforeEditLocation(child, root, editLocation, baseState, currState);
                }
            }
        }
    }

    /**
     * Get corresponding character index in state otherState
     * @param baseState
     * @param otherState
     * @param i
     * @return
     */
    public int getIdxInOtherState(int baseState, int otherState, int i) {
        // TODO verify this
        int idx = i;
        if (i < 0) {
//            System.out.println("uh oh");
        }
        while (baseState != otherState) {
            if (baseState < 0 || baseState >= trees.size() || idx == -1) return -1;

            if (baseState > otherState) {
                if (idx >= correspondance.allIdxInLastSnapshot.get(baseState).size()) return -1;
                int nextIdx = correspondance.allIdxInLastSnapshot.get(baseState).get(idx);
                baseState --;
                idx = nextIdx;
            } else {
                List<Integer> nextCorr = correspondance.allIdxInLastSnapshot.get(baseState+1);
                int nextIdx = nextCorr.indexOf(idx);
                baseState ++;
                idx = nextIdx;
            }
        }
        return idx;
    }


    private int getIdxInNextCompilable(int state, int i) {
        // TODO double check with more complex tests, I'm worried this ternary assignment for idx is wrong
        int idx = (i < correspondance.allIdxInLastSnapshot.get(state).size()
                && correspondance.allIdxInLastSnapshot.get(state).get(i) == -1)
                    ? i
                    : correspondance.allIdxInLastSnapshot.get(state).indexOf(i);
        while (!correspondance.allCompilable.get(state)) {
            if (state >= trees.size() - 1 || idx == -1) return -1;

            int nextIdx = correspondance.allIdxInLastSnapshot.get(state + 1).indexOf(idx);
            state++;
            idx = nextIdx;
        }
        return idx;
    }

    private int getIdxInPrevSnapshot(int targetState, int startState, int i) {
        if (i > correspondance.allIdxInLastSnapshot.get(startState).size() - 1) return -1;
        int corresponds = correspondance.allIdxInLastSnapshot.get(startState).get(i);
        while (startState > targetState + 1) {
            startState--;
            if (corresponds == -1 || corresponds > correspondance.allIdxInLastSnapshot.get(startState).size() - 1) return -1;
            corresponds = correspondance.allIdxInLastSnapshot.get(startState).get(corresponds);
        }
        return corresponds;
    }

    private int getLastCompilable(int index) {
        while (index >= 0) {
            if (correspondance.allCompilable.get(index)) {
                return index;
            }
            index--;
        }
        return -1;
    }

    private int getNextCompilable(int index) {
        while (index < trees.size()) {
            if (correspondance.allCompilable.get(index)) {
                return index;
            }
            index++;
        }
        return -1;
    }

    public void insertEmptyChild(Node parent, Node newChild, int targetState, int startState) {
        // find first character in newChild that exists in targetState
        int firstExistingIndex = newChild.startIndex;
        while (getIdxInPrevSnapshot(targetState, startState, firstExistingIndex) == -1 && firstExistingIndex < newChild.startIndex + newChild.length) {
            firstExistingIndex++;
//            System.out.println(targetState + " increasing index in insertEmptyChild");
        }
        // Shouldn't ever happen
        if (firstExistingIndex >= newChild.startIndex + newChild.length) {
            throw new RuntimeException("Node being insert has no correspondence to current state");
        }

        Node emptyNode = new Node("EMPTY", getIdxInPrevSnapshot(targetState, startState, firstExistingIndex), 0, new ArrayList<>(), "", targetState);
//        Node emptyNode = new Node("EMPTY", getIdxInOtherState(startState, targetState, firstExistingIndex), 0, new ArrayList<>(), "");
        boolean added = false;
        for (int i = 0; i < parent.children.size(); i++) {
            if (getIdxInPrevSnapshot(targetState, startState, firstExistingIndex)  <= parent.children.get(i).startIndex) {
                parent.children.add(i, emptyNode);
                added = true;
                break;
            }
        }
        if (!added) {
            parent.children.add(emptyNode);

            // Update parents length to include any whitespace if child is the last child in the tree
            Node grandparent = parent.parent;
            boolean isLastChild;
            if (grandparent == null) {
                isLastChild = true;
            } else {
                isLastChild = grandparent.children.indexOf(parent) == grandparent.children.size() - 1;
                while (grandparent.parent != null && isLastChild) {
                    grandparent = grandparent.parent;
                    isLastChild = grandparent.children.indexOf(parent) == grandparent.children.size() - 1;
                }
            }
            if (isLastChild) {
                Node root = parent;
                while (root.parent != null) {
                    root = root.parent;
                }
                root.editLength(parent, emptyNode.startIndex - parent.getEndInclusiveIndex());
            }
        }
        emptyNode.parent = parent;

        newChild.tparent = emptyNode;
    }

    // returns dParent if not null, otherwise returns tParent
    public Node getDOrTParent(Node n, int state, int charIdx) {
        if (state == 0 || (n.dparent != null && Objects.equals(n.dparent.label, "EMPTY"))) {
            return n.dparent;
        }
        return this.correspondance.allCompilable.get(state - 1) && charIdx == 0 ? n.tparent : n.dparent;
    }

    // returns dChild if not null, otherwise returns tChild
    public Node getDOrTChild(Node n, int state, int charIdx) {
        return this.correspondance.allCompilable.get(state - 1) && charIdx == 0 ? n.tchild : n.dchild;
    }

    public Node getNodeByLocation(Node n, int location) {
        boolean didChange = true;
        while (!n.children.isEmpty() && didChange) {
            didChange = false;
            for (Node child : n.children) {
                if (child.startIndex <= location && location < child.startIndex + child.length && child.length > 0) {
                    n = child;
                    didChange = true;
                    break;
                }
            }
        }
        return n;
    }

    public boolean getIsCompilable(int state) {
        return this.correspondance.allCompilable.get(state);
    }


}
