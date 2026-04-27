package parser;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

public class TemporalHierarchy {

    // don't reset this value
    private int nextTid = 0;
    public List<Node> tidToNode = new ArrayList<>();

    // idxInLastSnapshot[i] contains the index in the last snapshot (last edit)
    // for the character currently at index i. -1 if the character was just
    // inserted.
    public List<Integer> idxInLastSnapshot = new ArrayList<>();
    public List<List<Integer>> allIdxInLastSnapshot = new ArrayList<>();

    // idxInLastCompilable[i] contains the index in the last compilable snapshot
    // for the character currently at index i. -1 if the character was inserted
    // since the last compilable event.
    public List<List<Integer>> allIdxInLastCompilable = new ArrayList<>();

    // Whether the last code snapshot was compilable
    // (the AST in the last iteration existed).
    public List<Node> trees = new ArrayList<>();
    public List<Boolean> allCompilable = new ArrayList<>();

    public void temporalCorrespondence(int i, int treeNumber, String insertText, String deleteText) {
        // Setup
        final List<Integer> inserted = new ArrayList<>(Collections.nCopies(insertText.length(), -1));

        // Set indices for the array: [0, 1, 2, 3, ...]
        for (int index = 0; index < this.idxInLastSnapshot.size(); ++index) {
            this.idxInLastSnapshot.set(index, index);
        }

        // beforeInsert/afterInsert are the mappings of all characters
        // preceding/following the insertion and deletion.
        final List<Integer> beforeInsert = this.idxInLastSnapshot.subList(0, i);
        final List<Integer> afterInsert = this.idxInLastSnapshot.subList(i + deleteText.length(),
                this.idxInLastSnapshot.size());

        // Create the new array.
        this.idxInLastSnapshot = Stream.concat(Stream.concat(beforeInsert.stream(), inserted.stream()),
                afterInsert.stream()).toList();
        this.idxInLastSnapshot = new ArrayList<>(this.idxInLastSnapshot);
        this.allIdxInLastSnapshot.add(new ArrayList<>(this.idxInLastSnapshot));
        this.allIdxInLastCompilable.add(new ArrayList<>(this.idxInLastSnapshot));

//        if (treeNumber >= 10 && treeNumber <= 15) {
//            int sn = this.allIdxInLastSnapshot.size();
//            List<Integer> lastMap = this.allIdxInLastSnapshot.get(sn-1);
//            System.out.println(String.format("xyz%d (%d) ", treeNumber, lastMap.size()) + lastMap);
//        }

        // exit if the last tree was compilable
        if (this.allCompilable.size() > 1 && (this.allCompilable.get(this.allCompilable.size() - 2))) {
            return;
        }

        final var length = allIdxInLastCompilable.get(allIdxInLastCompilable.size() - 1).size();
        for (int k = 0; k < length; ++k) {
            // If the character was not inserted, get the index from the
            // idxInLastCompilable from the last snapshot.
            int previousK = this.idxInLastSnapshot.get(k);

            if (previousK != -1) {
                final int newK = this.allIdxInLastCompilable.get(allIdxInLastCompilable.size() - 2).get(previousK);
                this.allIdxInLastCompilable.get(allIdxInLastCompilable.size() - 1).set(k, newK);
            }
        }
    }

    public void temporalHierarchy(Node tree, List<String> codeStates) {
        // Update tid values. trees is the list of all prase trees to this point.
        this.setTids(tree);
        if (!trees.isEmpty()) {
            this.setTparentImpl(tree, codeStates);
        }
        this.trees.add(tree);

        // Set number of edits since last compilable state for each ast node
        // Note: this currently gets the number of edits since the last snapshot only.
        this.setNumEdits(tree);
    }

    private void setTids(Node tree) {
        if (tree == null) {
            return;
        }

//        if (tree.tid == -1) {
//            tree.tid = this.nextTid;
//            this.tidToNode.add(this.nextTid, tree);
//            this.nextTid += 1;
//        }

        if (tree.children != null) {
            for (Node child : tree.children) {
                this.setTids(child);
            }
        }
    }

    private void setNumEdits(Node tree) {
        // Initial program state
        if (this.allCompilable.size() == 1 && this.allCompilable.get(0)) {
            tree.numInserts = 0;
            tree.numDeletes = 0;
        }

        // New temporal node
        else if (tree.tparent == null) {
            tree.numInserts += tree.length;
        }

        // Last program state is compilable
        else if (this.allCompilable.get(this.allCompilable.size() - 2)) {
            final int oldLength = tree.tparent.length;
            final int newLength = tree.length;

            tree.numInserts += Math.max(0, newLength - oldLength);
            tree.numDeletes += Math.max(0, oldLength - newLength);
        }

        // Last program state is uncompilable
        else {

            // Find the last compilable state and the current state
            int finalState = this.allCompilable.size() - 1;
            int firstState = this.allCompilable.size() - 2;
            while (!this.allCompilable.get(firstState)) {
                firstState -= 1;
            }

            int start = tree.startIndex;
            int end = tree.getEndInclusiveIndex();
            // int end = tree.tparent.length + tree.tparent.startIndex - 1;
            int oldSize = tree.tparent.length;

            // Forward pass (start -> end) for deletions
            for (int index = firstState + 1; index <= finalState; ++index) {
                final List<Integer> idxInLastSnapshot = this.allIdxInLastSnapshot.get(index);

                // Shrink the start & end so they fit in the selection
                int startIndex = Math.max(idxInLastSnapshot.indexOf(start), 0);
                int endIndex = idxInLastSnapshot.indexOf(end);
                while (startIndex == -1 && start < end) {
                    start += 1;
                    startIndex = idxInLastSnapshot.indexOf(start);
                }
                while (endIndex == -1 && start < end) {
                    end -= 1;
                    endIndex = idxInLastSnapshot.indexOf(end);
                }

                // Expand the edges so we gobble up any -1s on the edges
                // [0, 1, 2] -> [0, 1, 2, -1, -1]
                while ((startIndex - 1) >= 0 && idxInLastSnapshot.get(startIndex - 1) == -1) {
                    startIndex -= 1;
                }
                while ((endIndex + 1) < idxInLastSnapshot.size() && idxInLastSnapshot.get(endIndex + 1) == -1) {
                    endIndex += 1;
                }

                final List<Integer> selection = idxInLastSnapshot.subList(startIndex, endIndex + 1);
                final int newSize = selection.size();

                tree.numInserts += Math.max(0, newSize - oldSize);
                tree.numDeletes += Math.max(0, oldSize - newSize);

                oldSize = newSize;
                start = startIndex;
                end = endIndex;
            }
        }

        for (Node child : tree.children) {
            this.setNumEdits(child);
        }
    }

    /**
     * Sets the tparent for cur and all cur's descendants.
     *
     * @param cur
     * @param codeStates
     */
    private void setTparentImpl(Node cur, List<String> codeStates) {
        // Get the start and end indices in the code as it was
        // when the previous ast was created
        int ll = -2;
        while (ll >= -allCompilable.size() && !allCompilable.get(allCompilable.size()+ll)) ll--;
        int[] indices = prev_start_end(cur.startIndex, cur.startIndex + cur.length,
                this.allIdxInLastCompilable.get(this.allIdxInLastCompilable.size() - 1), codeStates.get(codeStates.size()+ll));
        int curStartInPrevCoords = indices[0];
        int curEndInPrevCoords = indices[1];

        // traverses through prev looking for a tparent for cur
        set_cur_tparent(this.trees.get(this.trees.size()-1), cur, curStartInPrevCoords, curEndInPrevCoords);

        // If no tparent was set but it has previous coordinates then it is likely commented out
        // in the previous tree. Iterate back until we either end up with -1 coordinates or find
        // a tparent.
        // As we go backwards in time, k and l both refer to previous compilable snapshots. k is
        // the index into the trees list, which has entries only for compilable snapshots, and l
        // is the index into the allIdxInLastCompilable list, which has entries for every snapshot.
        int k = -1;
        int l = -1;
        while (trees.size() >= -k && cur.tparent == null && !cur.label.equals("RootContext") && curStartInPrevCoords > -1) {
            if (curEndInPrevCoords == -1) {
                throw new RuntimeException("Unexpected -1 prev coords");
            }
            k -= 1;
            l -= 1;
            while (l >= -allCompilable.size() && !allCompilable.get(allCompilable.size()+l)) {
                l -= 1;
            }
//            indices = prev_start_end(curStartInPrevCoords, curEndInPrevCoords, allIdxInLastCompilable.get(allIdxInLastCompilable.size()+l), codeStates.get(codeStates.size()+l));
            int lll = l-1;
            while (lll >= -allCompilable.size() && !allCompilable.get(allCompilable.size()+lll)) {
                lll -= 1;
            }
            String lastCompilableSrc = codeStates.get(codeStates.size()+lll);
            indices = prev_start_end(curStartInPrevCoords, curEndInPrevCoords,
                    allIdxInLastCompilable.get(allIdxInLastCompilable.size()+l),
                    lastCompilableSrc);
            curStartInPrevCoords = indices[0];
            curEndInPrevCoords = indices[1];
            if (trees.size() >= -k) {
                set_cur_tparent(trees.get(trees.size() + k), cur, curStartInPrevCoords, curEndInPrevCoords);
            }
        }

        // Make recursive call for all of cur's children
        for (Node n:cur.children) {
            setTparentImpl(n, codeStates);//asts, n, allIdxInLastCompilable, allCompilable);
        };
    }

    void set_cur_tparent(Node prev, Node cur, int curStartInPrevCoords, int curEndInPrevCoords) {
//        if (cur.label.equals("RootContext")) {
//            return;
//        }

        boolean deeper = true;
        final int pstarti = prev.startIndex;
        final int pendi = prev.startIndex + prev.length;
        final boolean contains = (pstarti <= curStartInPrevCoords && pendi >= curEndInPrevCoords);
//        if (!prev.label.equals("RootContext") && contains) {
        if (contains) {
            // Only set the parent if the types are the same or if one of them is an identifier
//            if (prev.label.equals(cur.label) || (prev.type === 'Name' || cur.type === 'Name')) {
            // Identifiers leaf nodes are always "Terminal" labels, so even though the identifier changes,
            // the label doesn't.
            if (prev.label.equals(cur.label) && prev.tchild == null) {
                if (cur.tparent != null) {
                    cur.tparent.tchild = null;
                }
                cur.tparent = prev;
                prev.tchild = cur;
                cur.numInserts = prev.numInserts;
                cur.numDeletes = prev.numDeletes;
            }
        }
        // Go deeper if the current node is smaller then the prev node to see if there
        // is a better fit.
        // deeper = (curStartInPrevCoords >= pstarti && curEndInPrevCoords <= pendi);
        if (contains) {
            for (Node n:prev.children) {
                set_cur_tparent(n, cur, curStartInPrevCoords, curEndInPrevCoords);
            }
        }
    }

    /* Return a tuple of (start, end) */
    private int[] prev_start_end(int start, int end, List<Integer> idxInLastSnapshot, String codeState) {
        int n = idxInLastSnapshot.size();
        int i = start;
        // end inclusive
        int j = end - 1;
        // Iterate past newly-added characters to the beginning then the end of the node
        while (idxInLastSnapshot.get(i) == -1 && i < j) {
            i += 1;
        }
        while (idxInLastSnapshot.get(j) == -1 && i < j) {
            j -= 1;
        }

        int prev_start = idxInLastSnapshot.get(i);
        int prev_end_minus_one = idxInLastSnapshot.get(j);

        if (prev_start == prev_end_minus_one) {
            if (prev_start == -1) {
                return new int[] {-1, -1};
            }
            return new int[] {prev_start, prev_end_minus_one + 1};
        } else {
            if (prev_start == -1 || prev_end_minus_one == -1) {
                // Either both indices must be -1 (a new node) or they must both point to valid character
                throw new RuntimeException("Illegal previous indices");
            }
            // It is possible that the text from start to end includes whitespace which won't be
            // represented in the start/end of the previous node.
            while (Character.isWhitespace(codeState.charAt(prev_start)) && prev_start < prev_end_minus_one) {
                prev_start++;
            }
            if (prev_end_minus_one >= codeState.length()) {
                throw new RuntimeException("prev_end_minus_one is outside bounds");
            }
            while (Character.isWhitespace(codeState.charAt(prev_end_minus_one)) && prev_start < prev_end_minus_one) {
                prev_end_minus_one--;
            }

            return new int[] {prev_start, prev_end_minus_one + 1};
        }
//        private int[] previousStartEndIndices(int start, int end, List<Integer> lastCompilable) {
//        // Use the last snapshot to find the old indicies
//        while (start < end && start < lastCompilable.size() && lastCompilable.get(start) == -1) {
//            start += 1;
//        }
//        while (start < end && end > 0 && lastCompilable.get(end) == -1) {
//            end -= 1;
//        }
//
//        // Get the start/end for the previous snapshot
//        // Add `1` to the end as it moves backwards one too much
//        final int previousStart = lastCompilable.get(start);
//        final int previousEnd = lastCompilable.get(end) + 1;
//
//        if (previousStart == -1 && previousEnd == -1) {
//            return new int[] { -1, -1 };
//        } else {
//            return new int[] { previousStart, previousEnd };
//        }
    }
}
