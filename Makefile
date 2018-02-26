PANDOC=/usr/local/bin/pandoc
LATEX_ENGINE=/Library/TeX/texbin/pdflatex

notes: flow-notes.md
	$(PANDOC) flow-notes.md --template simple.latex --latex-engine=$(LATEX_ENGINE) --output=flow-notes.pdf

clean:
	rm flow-notes.pdf
