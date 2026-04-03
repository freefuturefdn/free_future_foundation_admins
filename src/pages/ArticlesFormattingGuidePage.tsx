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
        Use this guide when writing post content. Both content sections in a post should use the same format mode selected in the editor.
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
                Recommended for headings, lists, links, emphasis, and readable source formatting.
              </Card.Text>
              <pre className="guide-code-block"># Main Heading
## Section Heading

**Bold text** and *italic text*

- Bullet one
- Bullet two

1. First item
2. Second item

[Visit Free Future Foundation](https://example.org)</pre>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={12}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Body>
              <Card.Title className="text-primary">HTML</Card.Title>
              <Card.Text className="text-muted mb-3">
                Use when you need precise layout control. HTML is sanitized for safety, so scripts and unsafe tags are removed automatically.
              </Card.Text>
              <pre className="guide-code-block">&lt;h2&gt;Section Title&lt;/h2&gt;
&lt;p&gt;This is a paragraph with &lt;strong&gt;bold&lt;/strong&gt; text.&lt;/p&gt;
&lt;ul&gt;
  &lt;li&gt;List item one&lt;/li&gt;
  &lt;li&gt;List item two&lt;/li&gt;
&lt;/ul&gt;
&lt;blockquote&gt;Highlight an important quote.&lt;/blockquote&gt;</pre>
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
                <th>HTML</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Heading</td>
                <td># Title</td>
                <td>&lt;h1&gt;Title&lt;/h1&gt;</td>
              </tr>
              <tr>
                <td>Bold text</td>
                <td>**Important**</td>
                <td>&lt;strong&gt;Important&lt;/strong&gt;</td>
              </tr>
              <tr>
                <td>Link</td>
                <td>[Label](https://example.com)</td>
                <td>&lt;a href="https://example.com"&gt;Label&lt;/a&gt;</td>
              </tr>
              <tr>
                <td>Bullet list</td>
                <td>- One</td>
                <td>&lt;ul&gt;&lt;li&gt;One&lt;/li&gt;&lt;/ul&gt;</td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
