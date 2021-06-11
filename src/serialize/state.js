import { MarkdownSerializerState as BaseMarkdownSerializerState } from "prosemirror-markdown/src/to_markdown";
import { trimInline } from "../util/markdown";


/**
 * Override default MarkdownSerializerState to handle commonmark delimiters:
 * https://spec.commonmark.org/0.29/#left-flanking-delimiter-run
 */
export class MarkdownSerializerState extends BaseMarkdownSerializerState {

    constructor(nodes, marks, options) {
        super(nodes, marks, options);
        this.inlines = [];
    }

    renderContent(parent) {
        this.withSerializableSchema(parent.type.schema, () => {
            super.renderContent(parent);
        });
    }

    render(node, parent, index) {
        super.render(node, parent, index);
        const top = this.inlines[this.inlines.length - 1];
        if(top?.start && top?.end) {
            this.out = trimInline(this.out, top.delimiter, top.start, top.end);
            this.inlines.pop();
        }
    }

    markString(mark, open, parent, index) {
        const info = this.marks[mark.type.name]
        if(info.expelEnclosingWhitespace) {
            if(open) {
                this.inlines.push({
                    start: this.out.length,
                    delimiter: info.open,
                });
            } else {
                const top = this.inlines.pop();
                this.inlines.push({
                    ...top,
                    end: this.out.length,
                });
            }
        }
        return super.markString(mark, open, parent, index);
    }

    /**
     * update some nodes name due to serializer requiring on it
     */
    withSerializableSchema(schema, render) {
        const { hardBreak } = schema.nodes;
        if(hardBreak) {
            hardBreak.name = 'hard_break';
        }
        render();
        if(hardBreak) {
            hardBreak.name = 'hardBreak';
        }
    }
}
