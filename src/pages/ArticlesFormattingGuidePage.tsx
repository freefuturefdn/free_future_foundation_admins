import { Alert, Card, Col, Row, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function ArticlesFormattingGuidePage() {
  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="text-primary mb-0">Articles Formatting Guide</h4>
        <Link to="/dashboard/articles" className="btn btn-outline-secondary btn-sm">
          Back to Articles
        </Link>
      </div>

      <Alert variant="info" className="shadow-sm border-0">
        Use this guide when writing post content. Supported formats are Plain Text and Markdown.
      </Alert>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="text-primary">Plain Text</Card.Title>
              <Card.Text className="text-muted mb-3">
                Best for simple paragraphs with no styling.
              </Card.Text>
              <pre className="guide-code-block">This is a simple paragraph.

This is another paragraph on a new line.
Use blank lines to separate blocks.</pre>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="text-primary">Markdown</Card.Title>
              <Card.Text className="text-muted mb-3">
                Recommended for headings, emphasis, lists, links, quotes, code, and structure.
              </Card.Text>
              <pre className="guide-code-block"># Heading 1
## Heading 2
### Heading 3
#### Heading 4

**Bold text**
*Italic text*
***Bold and italic***

- Bullet item
- Another bullet

1. Numbered item
2. Numbered item

&gt; Blockquote text

[Link label](https://example.org)
![Image alt text](https://example.org/image.jpg)

Inline `code`

```
Code block
multiple lines
```

---
(horizontal line)</pre>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="text-primary">Markdown Tips</Card.Title>
              <Card.Text className="text-muted mb-3">
                Write in normal text first, then add markdown syntax where needed. Keep spacing simple: one blank line between sections is usually enough.
              </Card.Text>
              <pre className="guide-code-block">Good practice:
- Keep heading levels in order (# then ## then ###)
- Use numbered lists for steps, bullets for collections
- Use links instead of long raw URLs in the text
- Keep code in backticks to improve readability

Avoid:
- Mixing many heading levels in a short section
- Huge paragraphs without line breaks
- Broken links without https://</pre>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4 border-0 shadow-sm">
        <Card.Body>
          <Card.Title className="text-primary">Quick Reference</Card.Title>
          <Table responsive className="mb-0 align-middle">
            <thead>
              <tr>
                <th>Need</th>
                <th>Markdown</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Heading 1</td>
                <td># Title</td>
              </tr>
              <tr>
                <td>Bold text</td>
                <td>**Important**</td>
              </tr>
              <tr>
                <td>Italic text</td>
                <td>*Emphasis*</td>
              </tr>
              <tr>
                <td>Bullet list</td>
                <td>- One</td>
              </tr>
              <tr>
                <td>Numbered list</td>
                <td>1. First</td>
              </tr>
              <tr>
                <td>Link</td>
                <td>[Label](https://example.com)</td>
              </tr>
              <tr>
                <td>Blockquote</td>
                <td>{'>'} Quoted text</td>
              </tr>
              <tr>
                <td>Inline code</td>
                <td>`const x = 1`</td>
              </tr>
              <tr>
                <td>Code block</td>
                <td>``` code ```</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
