PANDOC=/usr/local/bin/pandoc
LATEX_ENGINE=pdflatex

notes: flow-notes.md
	$(PANDOC) flow-notes.md --template simple.latex --pdf-engine=$(LATEX_ENGINE) --output=flow-notes.pdf

clean:
	rm flow-notes.pdf
