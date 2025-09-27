"use client";

import {
  Heading,
  Text,
  Lead,
  Large,
  Small,
  Muted,
  Blockquote,
  Code,
  List,
  OrderedList,
  ListItem,
  Link,
  Badge,
  Divider
} from '@/components/Typography';

export default function TypographyShowcase() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Heading level={1} variant="gradient" className="mb-4">
            Typography Showcase
          </Heading>
          <Lead align="center" className="mb-6">
            A comprehensive demonstration of all typography components in the Neo Howling Blog design system.
          </Lead>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="accent">React</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge>Tailwind CSS</Badge>
            <Badge variant="outline">Dark Mode</Badge>
          </div>
        </div>

        <Divider />

        {/* Headings Section */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Headings</Heading>
          <div className="space-y-4">
            <Heading level={1}>Heading Level 1</Heading>
            <Heading level={2}>Heading Level 2</Heading>
            <Heading level={3}>Heading Level 3</Heading>
            <Heading level={4}>Heading Level 4</Heading>
            <Heading level={5}>Heading Level 5</Heading>
            <Heading level={6}>Heading Level 6</Heading>
          </div>

          <div className="mt-8">
            <Small className="mb-4 block">Gradient Variants:</Small>
            <div className="space-y-4">
              <Heading level={2} variant="gradient">Beautiful Gradient Heading</Heading>
              <Heading level={3} gradient>Another Gradient Style</Heading>
            </div>
          </div>
        </section>

        <Divider />

        {/* Text Components */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Text Components</Heading>

          <div className="space-y-6">
            <div>
              <Small className="mb-2 block font-semibold">Lead Text:</Small>
              <Lead>
                This is lead text, perfect for introductory paragraphs that need to stand out
                from regular body text. It&apos;s larger and has more relaxed line spacing.
              </Lead>
            </div>

            <div>
              <Small className="mb-2 block font-semibold">Large Text:</Small>
              <Large>This is large text for emphasis and important announcements.</Large>
            </div>

            <div>
              <Small className="mb-2 block font-semibold">Regular Text:</Small>
              <Text>
                This is regular body text. It&apos;s comfortable to read and provides good
                contrast in both light and dark modes. Perfect for articles and long-form content.
              </Text>
            </div>

            <div>
              <Small className="mb-2 block font-semibold">Small Text:</Small>
              <Small>This is small text, useful for captions, fine print, and secondary information.</Small>
            </div>

            <div>
              <Small className="mb-2 block font-semibold">Muted Text:</Small>
              <Muted>This is muted text with reduced contrast for less important information.</Muted>
            </div>
          </div>

          <div className="mt-8">
            <Small className="mb-4 block font-semibold">Text Variants:</Small>
            <div className="space-y-2">
              <Text variant="default">Default text color</Text>
              <Text variant="muted">Muted text color</Text>
              <Text variant="accent">Accent text color</Text>
              <Text variant="destructive">Destructive text color</Text>
            </div>
          </div>

          <div className="mt-8">
            <Small className="mb-4 block font-semibold">Text Sizes:</Small>
            <div className="space-y-2">
              <Text size="xs">Extra small text</Text>
              <Text size="sm">Small text</Text>
              <Text size="base">Base text</Text>
              <Text size="lg">Large text</Text>
              <Text size="xl">Extra large text</Text>
              <Text size="2xl">2XL text</Text>
              <Text size="3xl">3XL text</Text>
            </div>
          </div>

          <div className="mt-8">
            <Small className="mb-4 block font-semibold">Font Weights:</Small>
            <div className="space-y-2">
              <Text weight="thin">Thin weight</Text>
              <Text weight="extralight">Extra light weight</Text>
              <Text weight="light">Light weight</Text>
              <Text weight="normal">Normal weight</Text>
              <Text weight="medium">Medium weight</Text>
              <Text weight="semibold">Semibold weight</Text>
              <Text weight="bold">Bold weight</Text>
              <Text weight="extrabold">Extra bold weight</Text>
            </div>
          </div>
        </section>

        <Divider />

        {/* Blockquotes */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Blockquotes</Heading>

          <Blockquote className="mb-6">
            Typography is the craft of endowing human language with a durable visual form.
          </Blockquote>

          <Blockquote cite="Steve Jobs">
            Design is not just what it looks like and feels like. Design is how it works.
          </Blockquote>
        </section>

        <Divider />

        {/* Code Examples */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Code</Heading>

          <Text className="mb-4">
            You can use inline code like <Code>useState</Code> or <Code>useEffect</Code>
            within your text content.
          </Text>

          <Small className="mb-2 block">Code Block Example:</Small>
          <Code block>
            {`import React, { useState } from 'react';
import { Heading, Text } from '@/components/Typography';

function Component() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <Heading level={2}>Counter: {count}</Heading>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`}
          </Code>
        </section>

        <Divider />

        {/* Lists */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Lists</Heading>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Small className="mb-4 block font-semibold">Unordered List:</Small>
              <List>
                <ListItem>First item in the list</ListItem>
                <ListItem>Second item with more content</ListItem>
                <ListItem>Third item</ListItem>
                <ListItem>
                  Fourth item with nested content:
                  <List className="mt-2">
                    <ListItem>Nested item one</ListItem>
                    <ListItem>Nested item two</ListItem>
                  </List>
                </ListItem>
              </List>
            </div>

            <div>
              <Small className="mb-4 block font-semibold">Ordered List:</Small>
              <OrderedList>
                <ListItem>First step in the process</ListItem>
                <ListItem>Second step with details</ListItem>
                <ListItem>Third step</ListItem>
                <ListItem>Final step to completion</ListItem>
              </OrderedList>
            </div>
          </div>
        </section>

        <Divider />

        {/* Links */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Links</Heading>

          <div className="space-y-4">
            <Text>
              Here&apos;s a <Link href="#default">default link</Link> within body text that
              demonstrates the hover effects and styling.
            </Text>

            <Text>
              You can also use <Link href="#subtle" variant="subtle">subtle links</Link> that
              are less prominent but still accessible.
            </Text>

            <Text>
              For special calls-to-action, try <Link href="#accent" variant="accent">accent links</Link>
              that really stand out.
            </Text>

            <Text>
              External links <Link href="https://example.com" external>open in new tabs</Link>
              automatically when marked as external.
            </Text>
          </div>
        </section>

        <Divider />

        {/* Badges */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Badges</Heading>

          <div className="space-y-4">
            <div>
              <Small className="mb-2 block">Default Badges:</Small>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="accent">Accent</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div>
              <Small className="mb-2 block">Usage in Content:</Small>
              <Text>
                This article is tagged with <Badge variant="accent">React</Badge>, {' '}
                <Badge variant="secondary">TypeScript</Badge>, and {' '}
                <Badge>Design Systems</Badge>.
              </Text>
            </div>
          </div>
        </section>

        <Divider />

        {/* Alignment Examples */}
        <section className="mb-12">
          <Heading level={2} className="mb-6">Text Alignment</Heading>

          <div className="space-y-6">
            <div>
              <Small className="mb-2 block">Left Aligned (Default):</Small>
              <Text align="left">
                This text is aligned to the left, which is the default alignment for most content.
              </Text>
            </div>

            <div>
              <Small className="mb-2 block">Center Aligned:</Small>
              <Text align="center">
                This text is centered, perfect for titles, quotes, or special announcements.
              </Text>
            </div>

            <div>
              <Small className="mb-2 block">Right Aligned:</Small>
              <Text align="right">
                This text is aligned to the right, useful for dates, signatures, or special layouts.
              </Text>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Divider />

        <div className="text-center">
          <Muted>
            Typography showcase for the Neo Howling Blog design system. Built with React,
            TypeScript, and Tailwind CSS.
          </Muted>
        </div>
      </div>
    </div>
  );
}
