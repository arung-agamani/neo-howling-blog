# Typography Components

A comprehensive set of typography components for the Neo Howling Blog built with React and Tailwind CSS. These components provide a consistent, accessible, and beautiful typography system with dark mode support.

## Components Overview

### Heading

Responsive heading component with multiple sizes and variants.

```tsx
import { Heading } from '@/components/Typography';

// Basic usage
<Heading level={1}>Main Title</Heading>
<Heading level={2} variant="gradient">Gradient Subtitle</Heading>
<Heading level={3} align="center">Centered Heading</Heading>

// With custom styling
<Heading level={1} className="mb-8" gradient>
  Beautiful Gradient Title
</Heading>
```

**Props:**

-   `level` (1-6): Heading level (h1-h6)
-   `variant`: 'default' | 'gradient' | 'muted'
-   `gradient`: boolean - applies gradient effect
-   `align`: 'left' | 'center' | 'right'
-   `className`: Additional CSS classes
-   `as`: Custom HTML element

### Text

Flexible text component with size, weight, and leading options.

```tsx
import { Text } from '@/components/Typography';

<Text>Default paragraph text</Text>
<Text size="lg" weight="semibold">Large semibold text</Text>
<Text variant="muted" align="center">Muted centered text</Text>
<Text as="span" size="sm" weight="light">Inline light text</Text>
```

**Props:**

-   `size`: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
-   `weight`: 'thin' | 'extralight' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
-   `leading`: 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose'
-   `variant`: 'default' | 'muted' | 'accent' | 'destructive'
-   `align`: 'left' | 'center' | 'right'
-   `as`: HTML element to render as
-   `className`: Additional CSS classes

### Specialized Text Components

#### Lead

For introductory text or lead paragraphs.

```tsx
import { Lead } from "@/components/Typography";

<Lead>
    This is an introductory paragraph that stands out from regular body text.
</Lead>;
```

#### Large

For emphasized text that needs to stand out.

```tsx
import { Large } from "@/components/Typography";

<Large>Important announcement or call-out text</Large>;
```

#### Small

For fine print, captions, or secondary information.

```tsx
import { Small } from "@/components/Typography";

<Small>Caption text or fine print</Small>;
```

#### Muted

For less prominent text.

```tsx
import { Muted } from "@/components/Typography";

<Muted>Secondary or helper text</Muted>;
```

### Blockquote

For quotations with optional citation.

```tsx
import { Blockquote } from "@/components/Typography";

<Blockquote cite="Author Name">
    This is a beautiful quote that stands out from the regular content.
</Blockquote>;
```

### Code

For inline code and code blocks.

```tsx
import { Code } from '@/components/Typography';

// Inline code
<p>Use the <Code>useState</Code> hook for state management.</p>

// Code block
<Code block>
{`function hello() {
  console.log("Hello, world!");
}`}
</Code>
```

### Lists

Styled list components.

```tsx
import { List, OrderedList, ListItem } from '@/components/Typography';

<List>
  <ListItem>First item</ListItem>
  <ListItem>Second item</ListItem>
  <ListItem>Third item</ListItem>
</List>

<OrderedList>
  <ListItem>Step one</ListItem>
  <ListItem>Step two</ListItem>
  <ListItem>Step three</ListItem>
</OrderedList>
```

### Link

Beautiful links with hover effects.

```tsx
import { Link } from '@/components/Typography';

<Link href="/about">Internal link</Link>
<Link href="https://example.com" external>External link</Link>
<Link href="/contact" variant="subtle">Subtle link</Link>
<Link href="/featured" variant="accent">Accent link</Link>
```

**Props:**

-   `href`: URL or path
-   `variant`: 'default' | 'subtle' | 'accent'
-   `external`: boolean - adds target="\_blank" and rel attributes

### Badge

For tags, labels, and status indicators.

```tsx
import { Badge } from '@/components/Typography';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="accent">Accent</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Divider

Horizontal divider for separating content.

```tsx
import { Divider } from '@/components/Typography';

<Divider />
<Divider className="my-12" />
```

## Usage Examples

### Complete Article Example

```tsx
import {
    Heading,
    Text,
    Lead,
    Blockquote,
    Code,
    List,
    ListItem,
    Link,
    Badge,
    Divider,
} from "@/components/Typography";

function Article() {
    return (
        <article className="max-w-4xl mx-auto p-8">
            <Heading level={1} gradient className="mb-4">
                Building Modern Typography Systems
            </Heading>

            <div className="flex gap-2 mb-6">
                <Badge variant="accent">React</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge>Tailwind CSS</Badge>
            </div>

            <Lead className="mb-8">
                Typography is the foundation of good design. Learn how to build
                a comprehensive typography system that scales with your
                application.
            </Lead>

            <Heading level={2} className="mb-4">
                Introduction
            </Heading>

            <Text className="mb-4">
                A well-designed typography system provides consistency and
                improves readability across your entire application. In this
                article, we'll explore how to build flexible, reusable
                typography components.
            </Text>

            <Blockquote cite="Typography Handbook" className="mb-6">
                Good typography is invisible. When readers are absorbed in
                content, the typography is doing its job.
            </Blockquote>

            <Heading level={3} className="mb-4">
                Key Features
            </Heading>

            <List className="mb-6">
                <ListItem>
                    Responsive design with mobile-first approach
                </ListItem>
                <ListItem>Full dark mode support</ListItem>
                <ListItem>Accessible color contrasts</ListItem>
                <ListItem>Flexible component API</ListItem>
            </List>

            <Text className="mb-4">
                You can use inline code like <Code>useState</Code> or create
                code blocks for longer examples:
            </Text>

            <Code block className="mb-6">
                {`const [count, setCount] = useState(0);

function increment() {
  setCount(count + 1);
}`}
            </Code>

            <Divider />

            <Text variant="muted" align="center">
                Want to learn more? Check out our{" "}
                <Link href="/docs">documentation</Link>
                or visit our <Link href="https://github.com" external>
                    GitHub repository
                </Link>.
            </Text>
        </article>
    );
}
```

## Dark Mode Support

All typography components automatically support dark mode through Tailwind CSS's dark mode classes. The components will adapt their colors based on the user's theme preference.

## Customization

You can extend or customize any component by:

1. **Using className prop**: Add additional Tailwind classes
2. **Creating variants**: Extend the variant objects in the component definitions
3. **Custom components**: Create new components using the same patterns

## Accessibility

These components follow accessibility best practices:

-   Proper semantic HTML elements
-   Sufficient color contrast ratios
-   Focus visible states
-   Screen reader friendly markup

## Best Practices

1. **Hierarchy**: Use heading levels in order (h1, h2, h3, etc.)
2. **Consistency**: Stick to the defined text sizes and weights
3. **Spacing**: Use consistent margins and padding
4. **Contrast**: Ensure good contrast in both light and dark modes
5. **Performance**: Components are lightweight and tree-shakeable

## Installation & Setup

These components are already included in your project. Simply import what you need:

```tsx
// Import individual components
import { Heading, Text } from '@/components/Typography';

// Or import the default object
import Typography from '@/components/Typography';

// Usage with default object
<Typography.Heading level={1}>Title</Typography.Heading>
<Typography.Text>Body text</Typography.Text>
```
