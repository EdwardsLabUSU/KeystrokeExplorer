#! /bin/bash

dot -Tpdf orig.dot > orig.pdf
dot -Tpdf pruned.dot > pruned.pdf
dot -Tpdf recon.dot > recon.pdf
open orig.pdf pruned.pdf recon.pdf
