import { AstNode } from '../ast';

import { Single_inputContext } from "./Python3Parser";
import { File_inputContext } from "./Python3Parser";
import { Eval_inputContext } from "./Python3Parser";
import { DecoratorContext } from "./Python3Parser";
import { DecoratorsContext } from "./Python3Parser";
import { DecoratedContext } from "./Python3Parser";
import { Async_funcdefContext } from "./Python3Parser";
import { FuncdefContext } from "./Python3Parser";
import { ParametersContext } from "./Python3Parser";
import { TypedargslistContext } from "./Python3Parser";
import { TfpdefContext } from "./Python3Parser";
import { VarargslistContext } from "./Python3Parser";
import { VfpdefContext } from "./Python3Parser";
import { StmtContext } from "./Python3Parser";
import { Simple_stmtsContext } from "./Python3Parser";
import { Simple_stmtContext } from "./Python3Parser";
import { Expr_stmtContext } from "./Python3Parser";
import { AnnassignContext } from "./Python3Parser";
import { Testlist_star_exprContext } from "./Python3Parser";
import { AugassignContext } from "./Python3Parser";
import { Del_stmtContext } from "./Python3Parser";
import { Pass_stmtContext } from "./Python3Parser";
import { Flow_stmtContext } from "./Python3Parser";
import { Break_stmtContext } from "./Python3Parser";
import { Continue_stmtContext } from "./Python3Parser";
import { Return_stmtContext } from "./Python3Parser";
import { Yield_stmtContext } from "./Python3Parser";
import { Raise_stmtContext } from "./Python3Parser";
import { Import_stmtContext } from "./Python3Parser";
import { Import_nameContext } from "./Python3Parser";
import { Import_fromContext } from "./Python3Parser";
import { Import_as_nameContext } from "./Python3Parser";
import { Dotted_as_nameContext } from "./Python3Parser";
import { Import_as_namesContext } from "./Python3Parser";
import { Dotted_as_namesContext } from "./Python3Parser";
import { Dotted_nameContext } from "./Python3Parser";
import { Global_stmtContext } from "./Python3Parser";
import { Nonlocal_stmtContext } from "./Python3Parser";
import { Assert_stmtContext } from "./Python3Parser";
import { Compound_stmtContext } from "./Python3Parser";
import { Async_stmtContext } from "./Python3Parser";
import { If_stmtContext } from "./Python3Parser";
import { While_stmtContext } from "./Python3Parser";
import { For_stmtContext } from "./Python3Parser";
import { Try_stmtContext } from "./Python3Parser";
import { With_stmtContext } from "./Python3Parser";
import { With_itemContext } from "./Python3Parser";
import { Except_clauseContext } from "./Python3Parser";
import { BlockContext } from "./Python3Parser";
import { Match_stmtContext } from "./Python3Parser";
import { Subject_exprContext } from "./Python3Parser";
import { Star_named_expressionsContext } from "./Python3Parser";
import { Star_named_expressionContext } from "./Python3Parser";
import { Case_blockContext } from "./Python3Parser";
import { GuardContext } from "./Python3Parser";
import { PatternsContext } from "./Python3Parser";
import { PatternContext } from "./Python3Parser";
import { As_patternContext } from "./Python3Parser";
import { Or_patternContext } from "./Python3Parser";
import { Closed_patternContext } from "./Python3Parser";
import { Literal_patternContext } from "./Python3Parser";
import { Literal_exprContext } from "./Python3Parser";
import { Complex_numberContext } from "./Python3Parser";
import { Signed_numberContext } from "./Python3Parser";
import { Signed_real_numberContext } from "./Python3Parser";
import { Real_numberContext } from "./Python3Parser";
import { Imaginary_numberContext } from "./Python3Parser";
import { Capture_patternContext } from "./Python3Parser";
import { Pattern_capture_targetContext } from "./Python3Parser";
import { Wildcard_patternContext } from "./Python3Parser";
import { Value_patternContext } from "./Python3Parser";
import { AttrContext } from "./Python3Parser";
import { Name_or_attrContext } from "./Python3Parser";
import { Group_patternContext } from "./Python3Parser";
import { Sequence_patternContext } from "./Python3Parser";
import { Open_sequence_patternContext } from "./Python3Parser";
import { Maybe_sequence_patternContext } from "./Python3Parser";
import { Maybe_star_patternContext } from "./Python3Parser";
import { Star_patternContext } from "./Python3Parser";
import { Mapping_patternContext } from "./Python3Parser";
import { Items_patternContext } from "./Python3Parser";
import { Key_value_patternContext } from "./Python3Parser";
import { Double_star_patternContext } from "./Python3Parser";
import { Class_patternContext } from "./Python3Parser";
import { Positional_patternsContext } from "./Python3Parser";
import { Keyword_patternsContext } from "./Python3Parser";
import { Keyword_patternContext } from "./Python3Parser";
import { TestContext } from "./Python3Parser";
import { Test_nocondContext } from "./Python3Parser";
import { LambdefContext } from "./Python3Parser";
import { Lambdef_nocondContext } from "./Python3Parser";
import { Or_testContext } from "./Python3Parser";
import { And_testContext } from "./Python3Parser";
import { Not_testContext } from "./Python3Parser";
import { ComparisonContext } from "./Python3Parser";
import { Comp_opContext } from "./Python3Parser";
import { Star_exprContext } from "./Python3Parser";
import { ExprContext } from "./Python3Parser";
import { Atom_exprContext } from "./Python3Parser";
import { AtomContext } from "./Python3Parser";
import { NameContext } from "./Python3Parser";
import { Testlist_compContext } from "./Python3Parser";
import { TrailerContext } from "./Python3Parser";
import { SubscriptlistContext } from "./Python3Parser";
import { Subscript_Context } from "./Python3Parser";
import { SliceopContext } from "./Python3Parser";
import { ExprlistContext } from "./Python3Parser";
import { TestlistContext } from "./Python3Parser";
import { DictorsetmakerContext } from "./Python3Parser";
import { ClassdefContext } from "./Python3Parser";
import { ArglistContext } from "./Python3Parser";
import { ArgumentContext } from "./Python3Parser";
import { Comp_iterContext } from "./Python3Parser";
import { Comp_forContext } from "./Python3Parser";
import { Comp_ifContext } from "./Python3Parser";
import { Encoding_declContext } from "./Python3Parser";
import { Yield_exprContext } from "./Python3Parser";
import { Yield_argContext } from "./Python3Parser";
import { StringsContext } from "./Python3Parser";


export class Python3ParserVisitor {

    /* Should never be directly called */
    public visitChildren(ctx: any) {
        return new AstNode(ctx, "error", "ERROR");
    }

    public visitSyntax(ctx: any, type: string, parent: AstNode): AstNode {
        const syntax = new AstNode(ctx, type, type.toUpperCase());
        syntax.parent = parent;
        parent.children.push(syntax);
        return syntax;
    }

    visitSingle_input(ctx: Single_inputContext): AstNode {
        const node = new AstNode(ctx, "single_input", "INPUT");

        if (ctx.children[0] instanceof Simple_stmtsContext) {
            const childNode = this.visitSimple_stmts(ctx.children[0]);
            childNode.parent = node;
            node.children.push(childNode);

        } else if (ctx.children[0] instanceof Compound_stmtContext) {
            const childNode = this.visitCompound_stmt(ctx.children[0]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    visitFile_input(ctx: File_inputContext): AstNode {
        const node = new AstNode(ctx, "input", "INPUT");

        ctx.children.forEach(child => {
            if (child instanceof StmtContext) {
                const nodeChild = this.visitStmt(child);
                nodeChild.parent = node;
                node.children.push(nodeChild);
            };
        });

        return node;
    }

    visitEval_input(ctx: Eval_inputContext): AstNode {
        const node = new AstNode(ctx, "eval_input", "INPUT");

        const childNode = this.visitTestlist(ctx.children[0] as TestlistContext);
        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    visitDecorator(ctx: DecoratorContext): AstNode {
        const node = new AstNode(ctx, "decorator", "DECORATOR");

        this.visitSyntax(ctx.children[0], "@", node);

        const dottedChild = this.visitDotted_name(ctx.children[1] as Dotted_nameContext);
        dottedChild.parent = node;
        node.children.push(dottedChild);

        if (ctx.children[3] instanceof ArglistContext) {
            this.visitSyntax(ctx.children[2], "(", node);

            const childNode = this.visitArglist(ctx.children[3]);
            childNode.parent = node;
            node.children.push(childNode);

            this.visitSyntax(ctx.children[4], "(", node);
        }

        return node;
    }

    visitDecorators(ctx: DecoratorsContext): AstNode {
        const node = new AstNode(ctx, "decorators", "DECORATORS");

        ctx.children.forEach(child => {
            if (child instanceof DecoratorContext) {
                const childNode = this.visitDecorator(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitDecorated(ctx: DecoratedContext): AstNode {
        const node = new AstNode(ctx, "decorated", "DECORATED");

        const decoratorsChild = this.visitDecorators(ctx.children[0] as DecoratorsContext);
        decoratorsChild.parent = node;
        node.children.push(decoratorsChild);

        if (ctx.children[1] instanceof ClassdefContext) {
            const childNode = this.visitClassdef(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        } else if (ctx.children[1] instanceof FuncdefContext) {
            const childNode = this.visitFuncdef(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        } else if (ctx.children[1] instanceof Async_funcdefContext) {
            const childNode = this.visitAsync_funcdef(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        } else {  // error
            return null;
        }

        return node;
    }

    // todo - syntax
    visitAsync_funcdef(ctx: Async_funcdefContext): AstNode {
        const node = new AstNode(ctx, "async_funcdef", "ASYNC FUNC");

        const childNode = this.visitFuncdef(ctx.children[1] as FuncdefContext);
        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    // todo - syntax
    visitFuncdef(ctx: FuncdefContext): AstNode {
        const node = new AstNode(ctx, "function_def", "FUNC_DEF");

        const nameChild = this.visitName(ctx.children[1] as NameContext);
        nameChild.parent = node;
        node.children.push(nameChild);

        const parametersChild = this.visitParameters(ctx.children[2] as ParametersContext);
        parametersChild.parent = node;
        node.children.push(parametersChild);

        if (ctx.children.length === 7) {
            const testChild = this.visitTest(ctx.children[4] as TestContext);
            testChild.parent = node;
            node.children.push(testChild);
        }

        const lastChild = ctx.children.length - 1;
        const blockChild = this.visitBlock(ctx.children[lastChild] as BlockContext);
        blockChild.parent = node;
        node.children.push(blockChild);

        return node;
    }

    // todo - syntax
    visitParameters(ctx: ParametersContext): AstNode {
        const node = new AstNode(ctx, "parameters", "PARAMS");

        if (ctx.children[1] instanceof TypedargslistContext) {
            const childNode = this.visitTypedargslist(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitTypedargslist(ctx: TypedargslistContext): AstNode {
        const node = new AstNode(ctx, "typed_args", "ARGS");

        ctx.children.forEach(child => {
            if (child instanceof TfpdefContext) {
                const childNode = this.visitTfpdef(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitTfpdef(ctx: TfpdefContext): AstNode {
        const node = new AstNode(ctx, "type_def", "TYPE_DEF");

        const nameChild = this.visitName(ctx.children[0] as NameContext);
        nameChild.parent = node;
        node.children.push(nameChild);

        if (ctx.children.length > 1) {
            const testChild = this.visitTest(ctx.children[0] as TestContext);
            testChild.parent = node;
            node.children.push(testChild);
        }

        return node;
    }

    // todo - syntax
    visitVarargslist(ctx: VarargslistContext): AstNode {
        const node = new AstNode(ctx, "var_args", "ARGS");

        ctx.children.forEach(child => {
            if (child instanceof VfpdefContext) {
                const childNode = this.visitVfpdef(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitVfpdef(ctx: VfpdefContext): AstNode {
        return this.visitName(ctx.children[0] as NameContext);
    }

    // todo - syntax
    visitStmt(ctx: StmtContext): AstNode {
        const simpleStatements = ctx.simple_stmts();
        const compoundStatement = ctx.compound_stmt();

        if (simpleStatements) return this.visitSimple_stmts(simpleStatements);
        if (compoundStatement) return this.visitCompound_stmt(compoundStatement);

        return null;
    }

    // todo - syntax
    visitSimple_stmts(ctx: Simple_stmtsContext): AstNode {
        const node = new AstNode(ctx, "stmt_list", "SIMPLE_STMTS");

        ctx.children.forEach(child => {
            if (child instanceof Simple_stmtContext) {
                const childNode = this.visitSimple_stmt(child);
                childNode.parent = node;
                node.children.push(childNode);
            };
        });

        return node;
    }

    // todo - syntax
    visitSimple_stmt(ctx: Simple_stmtContext): AstNode {
        const node = new AstNode(ctx, "simple_stmt", "SIMPLE_STMT");

        const assert = ctx.assert_stmt();
        const del = ctx.del_stmt();
        const expr = ctx.expr_stmt();
        const flow = ctx.flow_stmt();
        const global = ctx.global_stmt();
        const importCtx = ctx.import_stmt();
        const nonlocal = ctx.nonlocal_stmt();
        const pass = ctx.pass_stmt();

        let childNode: AstNode = null;
        if (assert) childNode = this.visitAssert_stmt(assert);
        if (del) childNode = this.visitDel_stmt(del);
        if (expr) childNode = this.visitExpr_stmt(expr);
        if (flow) childNode = this.visitFlow_stmt(flow);
        if (global) childNode = this.visitGlobal_stmt(global);
        if (importCtx) childNode = this.visitImport_stmt(importCtx);
        if (nonlocal) childNode = this.visitNonlocal_stmt(nonlocal);
        if (pass) childNode = this.visitPass_stmt(pass);

        if (childNode === null) return null;

        childNode.parent = node;
        node.children.push(childNode);
        return node;
    }

    // todo - syntax
    visitExpr_stmt(ctx: Expr_stmtContext): AstNode {
        if (ctx.children.length === 1) {
            return this.visitTestlist_star_expr(ctx.children[0] as Testlist_star_exprContext);
        }

        const node = new AstNode(ctx, "expr", "EXPR");

        const testList = ctx.children[0] as Testlist_star_exprContext;
        const testListNode = this.visitTestlist_star_expr(testList);
        testListNode.parent = node;
        node.children.push(testListNode);

        // annassign
        if (ctx.children[1] instanceof AnnassignContext) {
            const childNode = this.visitAnnassign(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        // augassign (yield_expr|testlist)
        else if (ctx.children[1] instanceof AugassignContext) {
            const assignChild = this.visitAugassign(ctx.children[1]);
            assignChild.parent = node;
            node.children.push(assignChild);

            if (ctx.children[2] instanceof Yield_exprContext) {
                const childNode = this.visitYield_expr(ctx.children[2]);
                childNode.parent = node;
                node.children.push(childNode);
            } else {
                const childNode = this.visitTestlist(ctx.children[2] as TestlistContext);
                childNode.parent = node;
                node.children.push(childNode);
            }
        }

        // ( '=' (yield_expr|testlist_star_expr) )*
        else if (ctx.children.length >= 2) {
            ctx.children.forEach((child, index) => {
                if (index === 0) return;  // don't duplicate the testlist

                if (child instanceof Yield_exprContext) {
                    const childNode = this.visitYield_expr(child);
                    childNode.parent = node;
                    node.children.push(childNode);
                } else if (child instanceof Testlist_star_exprContext) {
                    const childNode = this.visitTestlist_star_expr(child);
                    childNode.parent = node;
                    node.children.push(childNode);
                }
            });
        }

        return node;
    }

    // todo - syntax
    visitAnnassign(ctx: AnnassignContext): AstNode {
        const node = new AstNode(ctx, "annotated_assign", "ANNOTATE_ASSIGN");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitTestlist_star_expr(ctx: Testlist_star_exprContext): AstNode {
        const node = new AstNode(ctx, "keyword_list", "KEYWORDS");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Star_exprContext) {
                const childNode = this.visitStar_expr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitAugassign(ctx: AugassignContext): AstNode {
        const node = new AstNode(ctx, "aug_assign", "AUG_ASSIGN");

        return node;
    }

    // todo - syntax
    visitDel_stmt(ctx: Del_stmtContext): AstNode {
        const node = new AstNode(ctx, "del", "DEL");

        const exprList = this.visitExprlist(ctx.children[1] as ExprlistContext)
        exprList.parent = node;
        node.children.push(exprList);

        return node;
    }

    // todo - syntax
    visitPass_stmt(ctx: Pass_stmtContext): AstNode {
        const node = new AstNode(ctx, "pass", "PASS");

        return node;
    }

    // todo - syntax
    visitFlow_stmt(ctx: Flow_stmtContext): AstNode {
        const breakStmt = ctx.break_stmt();
        const continueStmt = ctx.continue_stmt();
        const returnStmt = ctx.return_stmt();
        const raiseStmt = ctx.raise_stmt();
        const yieldStmt = ctx.yield_stmt();

        if (breakStmt) return this.visitBreak_stmt(breakStmt);
        if (continueStmt) return this.visitContinue_stmt(continueStmt);
        if (returnStmt) return this.visitReturn_stmt(returnStmt);
        if (raiseStmt) return this.visitRaise_stmt(raiseStmt);
        if (yieldStmt) return this.visitYield_stmt(yieldStmt);

        return null;
    }

    // todo - syntax
    visitBreak_stmt(ctx: Break_stmtContext): AstNode {
        return new AstNode(ctx, "break", "BREAK");
    }

    // todo - syntax
    visitContinue_stmt(ctx: Continue_stmtContext): AstNode {
        return new AstNode(ctx, "continue", "CONTINUE");
    }

    // todo - syntax
    visitReturn_stmt(ctx: Return_stmtContext): AstNode {
        const node = new AstNode(ctx, "return", "RETURN");

        if (ctx.children.length > 1) {
            const childNode = this.visitTestlist(ctx.children[1] as TestlistContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitYield_stmt(ctx: Yield_stmtContext): AstNode {
        return this.visitYield_expr(ctx.children[0] as Yield_exprContext);
    }

    // todo - syntax
    visitRaise_stmt(ctx: Raise_stmtContext): AstNode {
        const node = new AstNode(ctx, "raise", "RAISE");

        if (ctx.children.length >= 2) {
            const childNode = this.visitTest(ctx.children[1] as TestContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        if (ctx.children.length >= 4) {
            const childNode = this.visitTest(ctx.children[3] as TestContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitImport_stmt(ctx: Import_stmtContext): AstNode {
        if (ctx.children[0] instanceof Import_nameContext) return this.visitImport_name(ctx.children[0]);
        if (ctx.children[0] instanceof Import_fromContext) return this.visitImport_from(ctx.children[0]);
        return null;
    }

    // todo - syntax
    visitImport_name(ctx: Import_nameContext): AstNode {
        const node = new AstNode(ctx, "import", "IMPORT");

        const childNode = this.visitDotted_as_names(ctx.children[1] as Dotted_as_namesContext);
        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    // todo - syntax
    visitImport_from(ctx: Import_fromContext): AstNode {
        const node = new AstNode(ctx, "import_from", "IMPORT");

        ctx.children.forEach(child => {
            if (child instanceof Dotted_nameContext) {
                const childNode = this.visitDotted_name(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Import_as_namesContext) {
                const childNode = this.visitImport_as_names(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitImport_as_name(ctx: Import_as_nameContext): AstNode {
        const node = new AstNode(ctx, "import_as_name", "IMPORT_AS_NAME");

        const dottedChild = this.visitName(ctx.children[0] as NameContext);
        dottedChild.parent = node;
        node.children.push(dottedChild);

        if (ctx.children.length >= 3) {
            const nameChild = this.visitName(ctx.children[2] as NameContext);
            nameChild.parent = node;
            node.children.push(nameChild);
        }

        return node;
    }

    // todo - syntax
    visitDotted_as_name(ctx: Dotted_as_nameContext): AstNode {
        const node = new AstNode(ctx, "dotted_as_name", "DOTTED_AS_NAME");

        const dottedChild = this.visitDotted_name(ctx.children[0] as Dotted_nameContext);
        dottedChild.parent = node;
        node.children.push(dottedChild);

        if (ctx.children.length >= 3) {
            const nameChild = this.visitName(ctx.children[2] as NameContext);
            nameChild.parent = node;
            node.children.push(nameChild);
        }

        return node;
    }

    // todo - syntax
    visitImport_as_names(ctx: Import_as_namesContext): AstNode {
        const node = new AstNode(ctx, "import_as_names", "IMPORT_NAMES");

        ctx.children.forEach(child => {
            if (child instanceof Import_as_nameContext) {
                const childNode = this.visitImport_as_name(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitDotted_as_names(ctx: Dotted_as_namesContext): AstNode {
        const node = new AstNode(ctx, "dotted_as_names", "DOTTED_NAMES");

        ctx.children.forEach(child => {
            if (child instanceof Dotted_as_nameContext) {
                const childNode = this.visitDotted_as_name(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitDotted_name(ctx: Dotted_nameContext): AstNode {
        const node = new AstNode(ctx, "dotted_name", "DOTTED_NAME");

        ctx.children.forEach(child => {
            if (child instanceof NameContext) {
                const childNode = this.visitName(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitGlobal_stmt(ctx: Global_stmtContext): AstNode {
        const node = new AstNode(ctx, "global", "GLOBAL");

        ctx.children.forEach(child => {
            if (child instanceof NameContext) {
                const childNode = this.visitName(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitNonlocal_stmt(ctx: Nonlocal_stmtContext): AstNode {
        const node = new AstNode(ctx, "non_local", "NON_LOCAL");

        ctx.children.forEach(child => {
            if (child instanceof NameContext) {
                const childNode = this.visitName(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitAssert_stmt(ctx: Assert_stmtContext): AstNode {
        const node = new AstNode(ctx, "assert", "ASSERT");

        const testChild = this.visitTest(ctx.children[1] as TestContext);
        testChild.parent = node;
        node.children.push(testChild);

        if (ctx.children.length >= 4) {
            const childNode = this.visitTest(ctx.children[3] as TestContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitCompound_stmt(ctx: Compound_stmtContext): AstNode {
        const node = new AstNode(ctx, "compound_stmt", "COMPOUND_STMT");

        const ifStmt = ctx.if_stmt();
        const whileStmt = ctx.while_stmt();
        const forStmt = ctx.for_stmt();
        const tryStmt = ctx.try_stmt();
        const withStmt = ctx.with_stmt();
        const funcdef = ctx.funcdef();
        const classdef = ctx.classdef();
        const decorated = ctx.decorated();
        const asyncStmt = ctx.async_stmt();
        const matchStmt = ctx.match_stmt();

        let childNode: AstNode = null;
        if (ifStmt) childNode = this.visitIf_stmt(ifStmt);
        else if (whileStmt) childNode = this.visitWhile_stmt(whileStmt);
        else if (forStmt) childNode = this.visitFor_stmt(forStmt);
        else if (tryStmt) childNode = this.visitTry_stmt(tryStmt);
        else if (withStmt) childNode = this.visitWith_stmt(withStmt);
        else if (funcdef) childNode = this.visitFuncdef(funcdef);
        else if (classdef) childNode = this.visitClassdef(classdef);
        else if (decorated) childNode = this.visitDecorated(decorated);
        else if (asyncStmt) childNode = this.visitAsync_stmt(asyncStmt);
        else if (matchStmt) childNode = this.visitMatch_stmt(matchStmt);

        if (childNode === null) return null;

        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    // todo - syntax
    visitAsync_stmt(ctx: Async_stmtContext): AstNode {
        const node = new AstNode(ctx, "async", "ASYNC");

        if (ctx.children[1] instanceof FuncdefContext) {
            const childNode = this.visitFuncdef(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else if (ctx.children[1] instanceof With_stmtContext) {
            const childNode = this.visitWith_stmt(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else if (ctx.children[1] instanceof For_stmtContext) {
            const childNode = this.visitFor_stmt(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else {
            // error
            return null;
        }

        return node;
    }

    // todo - syntax
    visitIf_stmt(ctx: If_stmtContext): AstNode {
        const node = new AstNode(ctx, "if", "IF");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            else if (child instanceof BlockContext) {
                const childNode = this.visitBlock(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitWhile_stmt(ctx: While_stmtContext): AstNode {
        const node = new AstNode(ctx, "while", "WHILE");

        const testChild = this.visitTest(ctx.children[1] as TestContext);
        testChild.parent = node;
        node.children.push(testChild);

        const blockChild1 = this.visitBlock(ctx.children[3] as BlockContext);
        blockChild1.parent = node;
        node.children.push(blockChild1);

        if (ctx.children.length >= 7) {
            const blockChild2 = this.visitBlock(ctx.children[6] as BlockContext);
            blockChild2.parent = node;
            node.children.push(blockChild2);
        }

        return node;
    }

    // todo - syntax
    visitFor_stmt(ctx: For_stmtContext): AstNode {
        const node = new AstNode(ctx, "for", "FOR");

        const exprlistChild = this.visitExprlist(ctx.children[1] as ExprlistContext);
        exprlistChild.parent = node;
        node.children.push(exprlistChild);

        const testlistChild = this.visitTestlist(ctx.children[3] as TestlistContext);
        testlistChild.parent = node;
        node.children.push(testlistChild);

        const blockChild1 = this.visitBlock(ctx.children[5] as BlockContext);
        blockChild1.parent = node;
        node.children.push(blockChild1);

        if (ctx.children.length >= 9) {
            const blockChild2 = this.visitBlock(ctx.children[8] as BlockContext);
            blockChild2.parent = node;
            node.children.push(blockChild2);
        }

        return node;
    }

    // todo - syntax
    visitTry_stmt(ctx: Try_stmtContext): AstNode {
        const node = new AstNode(ctx, "try", "TRY");

        ctx.children.forEach(child => {
            if (child instanceof BlockContext) {
                const childNode = this.visitBlock(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Except_clauseContext) {
                const childNode = this.visitExcept_clause(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitWith_stmt(ctx: With_stmtContext): AstNode {
        const node = new AstNode(ctx, "with_smt", "WITH");

        ctx.children.forEach(child => {
            if (child instanceof With_itemContext) {
                const childNode = this.visitWith_item(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof BlockContext) {
                const childNode = this.visitBlock(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitWith_item(ctx: With_itemContext): AstNode {
        const node = new AstNode(ctx, "with_item", "WITH_ITEM");

        const testChild = this.visitTest(ctx.children[0] as TestContext);
        testChild.parent = node;
        node.children.push(testChild);

        if (ctx.children.length >= 3) {
            const exprChild = this.visitExpr(ctx.children[2] as ExprContext);
            exprChild.parent = node;
            node.children.push(exprChild);
        }

        return node;
    }

    // todo - syntax
    visitExcept_clause(ctx: Except_clauseContext): AstNode {
        const node = new AstNode(ctx, "except", "EXCEPT");

        if (ctx.children.length >= 2) {
            const childNode = this.visitTest(ctx.children[1] as TestContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        if (ctx.children.length >= 3) {
            const childNode = this.visitName(ctx.children[3] as NameContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitBlock(ctx: BlockContext): AstNode {
        if (ctx.children.length === 1) {
            return this.visitSimple_stmts(ctx.children[0] as Simple_stmtsContext);
        }

        const node = new AstNode(ctx, "block", "BLOCK");

        ctx.children.forEach(child => {
            if (child instanceof StmtContext) {
                const childNode = this.visitStmt(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    /* TODO */
    // todo - syntax
    visitMatch_stmt?: (ctx: Match_stmtContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitSubject_expr?: (ctx: Subject_exprContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitStar_named_expressions?: (ctx: Star_named_expressionsContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitStar_named_expression?: (ctx: Star_named_expressionContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitCase_block?: (ctx: Case_blockContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitGuard?: (ctx: GuardContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitPatterns?: (ctx: PatternsContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitPattern?: (ctx: PatternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitAs_pattern?: (ctx: As_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitOr_pattern?: (ctx: Or_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitClosed_pattern?: (ctx: Closed_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitLiteral_pattern?: (ctx: Literal_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitLiteral_expr?: (ctx: Literal_exprContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitComplex_number?: (ctx: Complex_numberContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitSigned_number?: (ctx: Signed_numberContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitSigned_real_number?: (ctx: Signed_real_numberContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitReal_number?: (ctx: Real_numberContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitImaginary_number?: (ctx: Imaginary_numberContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitCapture_pattern?: (ctx: Capture_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitPattern_capture_target?: (ctx: Pattern_capture_targetContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitWildcard_pattern?: (ctx: Wildcard_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitValue_pattern?: (ctx: Value_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitAttr?: (ctx: AttrContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitName_or_attr?: (ctx: Name_or_attrContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitGroup_pattern?: (ctx: Group_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitSequence_pattern?: (ctx: Sequence_patternContext) => AstNode;

    /* TODO */
    // todo - syntax
    visitOpen_sequence_pattern?: (ctx: Open_sequence_patternContext) => AstNode;

    // todo - syntax
    visitMaybe_sequence_pattern(ctx: Maybe_sequence_patternContext): AstNode {
        const node = new AstNode(ctx, "sequence", "SEQUENCE");

        ctx.children.forEach(child => {
            if (child instanceof Maybe_star_patternContext) {
                const childNode = this.visitMaybe_star_pattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitMaybe_star_pattern(ctx: Maybe_star_patternContext): AstNode {
        if (ctx.children[0] instanceof Star_patternContext) return this.visitStar_pattern(ctx.children[0]);
        if (ctx.children[0] instanceof PatternContext) return this.visitPattern(ctx.children[0]);

        return null;
    }

    // todo - syntax
    visitStar_pattern(ctx: Star_patternContext): AstNode {
        const node = new AstNode(ctx, "star", "STAR");

        if (ctx.children[1] instanceof Pattern_capture_targetContext) {
            const childNode = this.visitPattern_capture_target(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else if (ctx.children[1] instanceof Wildcard_patternContext) {
            const childNode = this.visitWildcard_pattern(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else {
            return null;
        }

        return node;
    }

    // todo - syntax
    visitMapping_pattern(ctx: Mapping_patternContext): AstNode {
        const node = new AstNode(ctx, "mapping", "MAPPING");

        ctx.children.forEach(child => {
            if (child instanceof Double_star_patternContext) {
                const childNode = this.visitDouble_star_pattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Items_patternContext) {
                const childNode = this.visitItems_pattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitItems_pattern(ctx: Items_patternContext): AstNode {
        const node = new AstNode(ctx, "items", "ITEMS");

        ctx.children.forEach(child => {
            if (child instanceof Key_value_patternContext) {
                const childNode = this.visitKey_value_pattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitKey_value_pattern(ctx: Key_value_patternContext): AstNode {
        const node = new AstNode(ctx, "key_value", "KEY_VALUE");

        if (ctx.children[0] instanceof Literal_exprContext) {
            const childNode = this.visitLiteral_expr(ctx.children[0]);
            childNode.parent = node;
            node.children.push(childNode);
        } else if (ctx.children[0] instanceof AttrContext) {
            const childNode = this.visitAttr(ctx.children[0]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        const patternChild = this.visitPattern(ctx.children[2] as PatternContext);
        patternChild.parent = node;
        node.children.push(patternChild);

        return node;
    }

    // todo - syntax
    visitDouble_star_pattern(ctx: Double_star_patternContext): AstNode {
        const node = new AstNode(ctx, "double_star", "**");

        const childNode = this.visitPattern_capture_target(ctx.children[1] as Pattern_capture_targetContext);
        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    // todo - syntax
    visitClass_pattern(ctx: Class_patternContext): AstNode {
        const node = new AstNode(ctx, "class_pattern", "CLASS");

        const nameChild = this.visitName_or_attr(ctx.children[0] as Name_or_attrContext);
        nameChild.parent = node;
        node.children.push(nameChild);

        ctx.children.forEach(child => {
            if (child instanceof Positional_patternsContext) {
                const childNode = this.visitPositional_patterns(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Keyword_patternsContext) {
                const childNode = this.visitKeyword_patterns(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitPositional_patterns(ctx: Positional_patternsContext): AstNode {
        const node = new AstNode(ctx, "positional_patterns", "PATTERNS");

        ctx.children.forEach(child => {
            if (child instanceof PatternContext) {
                const childNode = this.visitPattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitKeyword_patterns(ctx: Keyword_patternsContext): AstNode {
        const node = new AstNode(ctx, "keywords", "KEYWORDS");

        ctx.children.forEach(child => {
            if (child instanceof Keyword_patternContext) {
                const childNode = this.visitKeyword_pattern(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitKeyword_pattern(ctx: Keyword_patternContext): AstNode {
        const node = new AstNode(ctx, "keyword", "KEYWORD");

        const nameNode = this.visitName(ctx.children[0] as NameContext);
        nameNode.parent = node;
        node.children.push(nameNode);

        const patternNode = this.visitPattern(ctx.children[2] as PatternContext);
        patternNode.parent = node;
        node.children.push(patternNode);

        return node;
    }

    // todo - syntax
    visitTest(ctx: TestContext): AstNode {
        if (ctx.children[0] instanceof LambdefContext) return this.visitLambdef(ctx.children[0]);
        if (ctx.children.length === 1) return this.visitOr_test(ctx.children[0] as Or_testContext);

        const node = new AstNode(ctx, "turnary", "TURNARY");
        const lhs = this.visitOr_test(ctx.children[0] as Or_testContext);
        const comparator = this.visitOr_test(ctx.children[2] as Or_testContext);
        const rhs = this.visitTest(ctx.children[4] as TestContext);

        lhs.parent = node;
        comparator.parent = node;
        rhs.parent = node;

        node.children.push(lhs);
        node.children.push(comparator);
        node.children.push(rhs);

        return node;
    }

    // todo - syntax
    visitTest_nocond(ctx: Test_nocondContext): AstNode {
        if (ctx.children[0] instanceof Lambdef_nocondContext) return this.visitLambdef_nocond(ctx.children[0]);
        if (ctx.children[0] instanceof Or_testContext) return this.visitOr_test(ctx.children[0]);

        return null;
    }

    // todo - syntax
    visitLambdef(ctx: LambdefContext): AstNode {
        const node = new AstNode(ctx, "lamdef", "LAMBDEF");

        if (ctx.children.length === 4) {
            const varargsNode = this.visitVarargslist(ctx.children[1] as VarargslistContext);
            varargsNode.parent = node;
            node.children.push(varargsNode);
        }

        const testNode = this.visitTest(ctx.children.at(-1) as TestContext);
        testNode.parent = node;
        node.children.push(testNode);

        return node;
    }

    // todo - syntax
    visitLambdef_nocond(ctx: Lambdef_nocondContext): AstNode {
        const node = new AstNode(ctx, "lamdef", "LAMBDEF");

        if (ctx.children.length === 4) {
            const varargsNode = this.visitVarargslist(ctx.children[1] as VarargslistContext);
            varargsNode.parent = node;
            node.children.push(varargsNode);
        }

        const testNode = this.visitTest_nocond(ctx.children.at(-1) as Test_nocondContext);
        testNode.parent = node;
        node.children.push(testNode);

        return node;
    }

    // todo - syntax
    visitOr_test(ctx: Or_testContext): AstNode {
        if (ctx.children.length === 1) return this.visitAnd_test(ctx.children[0] as And_testContext);

        const node = new AstNode(ctx, "or", "OR");

        ctx.children.forEach(child => {
            if (child instanceof And_testContext) {
                const childNode = this.visitAnd_test(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitAnd_test(ctx: And_testContext): AstNode {
        if (ctx.children.length === 1) return this.visitNot_test(ctx.children[0] as Not_testContext);

        const node = new AstNode(ctx, "and", "AND");

        ctx.children.forEach(child => {
            if (child instanceof Not_testContext) {
                const childNode = this.visitNot_test(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitNot_test(ctx: Not_testContext): AstNode {
        if (ctx.children.length === 1) return this.visitComparison(ctx.children[0] as ComparisonContext);

        const node = new AstNode(ctx, "not", "NOT");

        const childNode = this.visitNot_test(ctx.children[0] as Not_testContext);
        childNode.parent = node;
        node.children.push(childNode);

        return node;
    }

    // todo - syntax
    visitComparison(ctx: ComparisonContext): AstNode {
        if (ctx.children.length === 1) return this.visitExpr(ctx.children[0] as ExprContext);

        const node = new AstNode(ctx, "comparison", "COMP");

        ctx.children.forEach(child => {
            if (child instanceof ExprContext) {
                const childNode = this.visitExpr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Comp_opContext) {
                const childNode = this.visitComp_op(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    visitComp_op(ctx: Comp_opContext): AstNode {
        return new AstNode(ctx, "comp_op", ctx.getText());
    }

    // todo - syntax
    visitStar_expr(ctx: Star_exprContext): AstNode {
        const node = new AstNode(ctx, "star_expr", "STAR_EXPR");

        node.children.push(this.visitExpr(ctx.children[1] as ExprContext));

        return node;
    }

    /* TODO: figure out how to do [expr (+|-) expr] and unarylists */
    // todo - syntax
    visitExpr(ctx: ExprContext): AstNode {
        // atomic operation
        if (ctx.atom_expr()) return this.visitAtom_expr(ctx.children[0] as Atom_exprContext);

        // binary operations
        if (ctx.POWER()) return this.visitBinary_expr(ctx, "power", "**");
        if (ctx.STAR()) return this.visitBinary_expr(ctx, "multiply", "*");
        if (ctx.AT()) return this.visitBinary_expr(ctx, "at", "@");
        if (ctx.DIV()) return this.visitBinary_expr(ctx, "divide", "/");
        if (ctx.MOD()) return this.visitBinary_expr(ctx, "modulo", "%");
        if (ctx.IDIV()) return this.visitBinary_expr(ctx, "int_divide", "//");
        // if (addExpr) return this.visitBinary_expr(ctx, "power", "**");
        // if (minusExpr) return this.visitBinary_expr(ctx, "power", "**");
        if (ctx.LEFT_SHIFT()) return this.visitBinary_expr(ctx, "left_shift", "<<");
        if (ctx.RIGHT_SHIFT()) return this.visitBinary_expr(ctx, "right_shift", ">>");
        if (ctx.AND_OP()) return this.visitBinary_expr(ctx, "and", "&");
        if (ctx.XOR()) return this.visitBinary_expr(ctx, "xor", "^");
        if (ctx.OR_OP()) return this.visitBinary_expr(ctx, "or", "|");

        // unary operations
        const addList = ctx.ADD_list();
        const minusList = ctx.MINUS_list();
        const notList = ctx.NOT_OP_list();

        return null;
    }

    // todo - syntax
    visitBinary_expr(ctx: ExprContext, type: string, name: string): AstNode {
        const node = new AstNode(ctx, type, name);

        const lhs = this.visitExpr(ctx.children[0] as ExprContext);
        const rhs = this.visitExpr(ctx.children[2] as ExprContext);

        lhs.parent = node;
        rhs.parent = node;

        node.children.push(lhs);
        node.children.push(rhs);

        return node;
    }

    /* TODO */
    // todo - syntax
    visitUnary_expr(ctx: ExprContext, type: string, name: string): AstNode {
        return null;
    }

    // todo - syntax
    visitAtom_expr(ctx: Atom_exprContext): AstNode {
        // sometimes we just have a singular atomic value
        if (ctx.children.length === 1)
            return this.visitAtom(ctx.children[0] as AtomContext);

        // sometimes we have the word "AWAIT" as the first child
        if (ctx.children.length === 2 && ctx.children[1] instanceof AtomContext)
            return this.visitAtom(ctx.children[0] as AtomContext);

        // sometimes we have trailers after the atomic (i.e. arrays)
        const node = new AstNode(ctx, "complex_atomic", "ATOMIC");

        ctx.children.forEach(child => {
            if (child instanceof AtomContext) {
                const childNode = this.visitAtom(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof TrailerContext) {
                const childNode = this.visitTrailer(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });
        return node;
    }

    // todo - syntax
    visitAtom(ctx: AtomContext): AstNode {
        // five options: name, (...), [...], {...}, TERMINAL

        if (ctx.children[0] instanceof NameContext) return this.visitName(ctx.children[0]);

        else if (ctx.OPEN_PAREN()) {
            const node = new AstNode(ctx, "tuple", "TUPLE");

            if (ctx.children[1] instanceof Yield_exprContext) {
                const childNode = this.visitYield_expr(ctx.children[1]);
                childNode.parent = node;
                node.children.push(childNode);
            }
            if (ctx.children[1] instanceof Testlist_compContext) {
                const childNode = this.visitTestlist_comp(ctx.children[1]);
                childNode.parent = node;
                node.children.push(childNode);
            }
            return node;
        }

        else if (ctx.OPEN_BRACK()) {
            const node = new AstNode(ctx, "list", "LIST");

            if (ctx.children[1] instanceof Testlist_compContext) {
                const childNode = this.visitTestlist_comp(ctx.children[1]);
                childNode.parent = node;
                node.children.push(childNode);
            }
            return node;
        }

        else if (ctx.OPEN_BRACE()) {
            const node = new AstNode(ctx, "dictionary", "DICT");

            if (ctx.children[1] instanceof DictorsetmakerContext) {
                const childNode = this.visitDictorsetmaker(ctx.children[1]);
                childNode.parent = node;
                node.children.push(childNode);
            }
            return node;
        }

        else if (ctx.NUMBER()) return new AstNode(ctx, "number", ctx.NUMBER().getText());
        else if (ctx.NONE()) return new AstNode(ctx, "none", "None");
        else if (ctx.TRUE()) return new AstNode(ctx, "boolean", "True");
        else if (ctx.FALSE()) return new AstNode(ctx, "boolean", "False");
        else if (ctx.ELLIPSIS()) return new AstNode(ctx, "ellipsis", "...");
        else if (ctx.STRING_list()) return new AstNode(ctx, "string", ctx.STRING_list().join());

        else return new AstNode(ctx, "constant", ctx.getText());
    }

    visitName(ctx: NameContext): AstNode {
        // either a variable name, underscore, or 'match'
        return new AstNode(ctx, "variable", ctx.getText());
    }

    // todo - syntax
    visitTestlist_comp(ctx: Testlist_compContext): AstNode {
        const node = new AstNode(ctx, "testlist_comp", "TESTLIST_COMP");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            else if (child instanceof Star_exprContext) {
                const childNode = this.visitStar_expr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            else if (child instanceof Comp_forContext) {
                const childNode = this.visitComp_for(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitTrailer(ctx: TrailerContext): AstNode {
        const node = new AstNode(ctx, "trailer", "TRAILER");

        if (ctx.children[1] instanceof NameContext) {
            const childNode = this.visitName(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else if (ctx.children[1] instanceof ArglistContext) {
            const childNode = this.visitArglist(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        else if (ctx.children[1] instanceof SubscriptlistContext) {
            const childNode = this.visitSubscriptlist(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitSubscriptlist(ctx: SubscriptlistContext): AstNode {
        const node = new AstNode(ctx, "subscript_list", "SUBSCRIPT_LIST");

        ctx.children.forEach(child => {
            if (child instanceof Subscript_Context) {
                const childNode = this.visitSubscript_(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitSubscript_(ctx: Subscript_Context): AstNode {
        const node = new AstNode(ctx, "subscript", "SUBSCRIPT");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof SliceopContext) {
                const childNode = this.visitSliceop(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitSliceop(ctx: SliceopContext): AstNode {
        const node = new AstNode(ctx, "slice", "SLICE");

        if (ctx.children.length === 2) {
            const childNode = this.visitTest(ctx.children[1] as TestContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitExprlist(ctx: ExprlistContext): AstNode {
        const node = new AstNode(ctx, "expr_list", "EXPR_LIST");

        ctx.children.forEach(child => {
            if (child instanceof ExprContext) {
                const childNode = this.visitExpr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
            if (child instanceof Star_exprContext) {
                const childNode = this.visitStar_expr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitTestlist(ctx: TestlistContext): AstNode {
        const node = new AstNode(ctx, "test_list", "TEST_LIST");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitDictorsetmaker(ctx: DictorsetmakerContext): AstNode {
        const node = new AstNode(ctx, "dictorset", "DICT");

        ctx.children.forEach(child => {
            if (child instanceof TestContext) {
                const childNode = this.visitTest(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof ExprContext) {
                const childNode = this.visitExpr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Comp_forContext) {
                const childNode = this.visitComp_for(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            if (child instanceof Star_exprContext) {
                const childNode = this.visitStar_expr(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitClassdef(ctx: ClassdefContext): AstNode {
        const node = new AstNode(ctx, "class_def", "CLASS");

        const nameNode = this.visitName(ctx.children[1] as NameContext);
        nameNode.parent = node;
        node.children.push(nameNode);

        if (ctx.children.length === 7) {
            const arglistNode = this.visitArglist(ctx.children[3] as ArglistContext);
            arglistNode.parent = node;
            node.children.push(arglistNode);
        }

        const blockNode = this.visitBlock(ctx.children.at(-1) as BlockContext);
        blockNode.parent = node;
        node.children.push(blockNode);

        return node;
    }

    // todo - syntax
    visitArglist(ctx: ArglistContext): AstNode {
        const node = new AstNode(ctx, "arglist", "ARGLIST");

        ctx.children.forEach(child => {
            if (child instanceof ArgumentContext) {
                const childNode = this.visitArgument(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitArgument(ctx: ArgumentContext): AstNode {
        if (ctx.children.length === 1) {
            return this.visitTest(ctx.children[0] as TestContext);
        }

        const node = new AstNode(ctx, "argument", "ARGUMENT");

        if (ctx.children.length === 2 && ctx.children[0] instanceof TestContext) {
            const testChild = this.visitTest(ctx.children[0]);
            testChild.parent = node;
            node.children.push(testChild);

            const compChild = this.visitComp_for(ctx.children[1] as Comp_forContext);
            compChild.parent = node;
            node.children.push(compChild);
        }

        else if (ctx.children.length === 2 && ctx.children[1] instanceof TestContext) {
            const testChild = this.visitTest(ctx.children[1]);
            testChild.parent = node;
            node.children.push(testChild);
        }

        else if (ctx.children.length === 3 && ctx.children[0] instanceof TestContext) {
            const testChild1 = this.visitTest(ctx.children[0]);
            testChild1.parent = node;
            node.children.push(testChild1);

            const testChild2 = this.visitTest(ctx.children[2] as TestContext);
            testChild2.parent = node;
            node.children.push(testChild2);

        }

        else {
            return null;
        }

        return node;
    }

    // todo - syntax
    visitComp_iter(ctx: Comp_iterContext): AstNode {
        if (ctx.children[0] instanceof Comp_forContext) return this.visitComp_for(ctx.children[0]);
        if (ctx.children[0] instanceof Comp_ifContext) return this.visitComp_if(ctx.children[0]);
        return null;
    }

    // todo - syntax
    visitComp_for(ctx: Comp_forContext): AstNode {
        const node = new AstNode(ctx, "comp_for", "COMP_FOR");

        ctx.children.forEach(child => {
            if (child instanceof ExprlistContext) {
                const childNode = this.visitExprlist(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            else if (child instanceof Or_testContext) {
                const childNode = this.visitOr_test(child);
                childNode.parent = node;
                node.children.push(childNode);
            }

            else if (child instanceof Comp_iterContext) {
                const childNode = this.visitComp_iter(child);
                childNode.parent = node;
                node.children.push(childNode);
            }
        });

        return node;
    }

    // todo - syntax
    visitComp_if(ctx: Comp_ifContext): AstNode {
        const node = new AstNode(ctx, "comp_if", "COMP_IF");

        const testChild = this.visitTest_nocond(ctx.children[1] as Test_nocondContext);
        testChild.parent = node;
        node.children.push(testChild);

        if (ctx.children.length === 3) {
            const compChild = this.visitComp_iter(ctx.children[2] as Comp_iterContext);
            compChild.parent = node;
            node.children.push(compChild);
        }

        return node;
    }

    // todo - syntax
    visitEncoding_decl(ctx: Encoding_declContext): AstNode {
        return this.visitName(ctx.children[0] as NameContext);
    }

    // todo - syntax
    visitYield_expr(ctx: Yield_exprContext): AstNode {
        const node = new AstNode(ctx, "yield", "YIELD");

        if (ctx.children.length > 1) {
            const childNode = this.visitYield_arg(ctx.children[2] as Yield_argContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitYield_arg(ctx: Yield_argContext): AstNode {
        const node = new AstNode(ctx, "yield_arg", "YIELD_ARG");

        if (ctx.children[1] instanceof TestContext) {
            const childNode = this.visitTest(ctx.children[1]);
            childNode.parent = node;
            node.children.push(childNode);
        } else {
            const childNode = this.visitTestlist(ctx.children[1] as TestlistContext);
            childNode.parent = node;
            node.children.push(childNode);
        }

        return node;
    }

    // todo - syntax
    visitStrings(ctx: StringsContext): AstNode {
        return new AstNode(ctx, "string", "STRING");
    }
}

