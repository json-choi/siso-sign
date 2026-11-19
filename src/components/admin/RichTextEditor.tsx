'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Highlighter,
  Palette,
  Undo,
  Redo,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const fontFamilies = [
  { label: '기본', value: 'inherit' },
  { label: 'Geist Sans', value: 'var(--font-geist-sans)' },
  { label: 'Cal Sans', value: 'var(--font-cal-sans)' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: 'var(--font-geist-mono)' },
];

const fontSizes = [
  { label: '작게', value: '0.875rem' },
  { label: '보통', value: '1rem' },
  { label: '크게', value: '1.25rem' },
  { label: '매우 크게', value: '1.5rem' },
  { label: '제목', value: '2rem' },
];

const colors = [
  '#ffffff', '#a1a1aa', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#a40035',
];

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [palette, setPalette] = useState<'color' | 'highlight' | null>(null);
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({ underline: false }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[150px] px-4 py-3 text-base focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setFontFamily = useCallback((font: string) => {
    if (!editor) return;
    if (font === 'inherit') {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(font).run();
    }
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }, [editor]);

  const setColor = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  }, [editor]);

  if (!editor) {
    return <div className="min-h-[190px] animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-black/20 p-1.5 [scrollbar-width:none]">
        <select
          onChange={(e) => setFontFamily(e.target.value)}
          className="h-8 shrink-0 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white focus:border-primary focus:outline-none"
          aria-label="폰트"
        >
          {fontFamilies.map((font) => (
            <option key={font.value} value={font.value} className="bg-[#111]">
              {font.label}
            </option>
          ))}
        </select>

        <select
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue="1rem"
          className="h-8 shrink-0 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white focus:border-primary focus:outline-none"
          aria-label="글자 크기"
        >
          {fontSizes.map((size) => (
            <option key={size.value} value={size.value} className="bg-[#111]">
              {size.label}
            </option>
          ))}
        </select>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="굵게">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="기울임">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="밑줄">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="취소선">
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="글머리 기호">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="번호 목록">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => setPalette(palette === 'color' ? null : 'color')} isActive={palette === 'color'} title="글자 색상">
          <Palette className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => setPalette(palette === 'highlight' ? null : 'highlight')} isActive={palette === 'highlight'} title="하이라이트">
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="실행 취소">
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="다시 실행">
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {palette && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 bg-black/30 px-2 py-2">
          <span className="mr-1 text-xs text-gray-500">{palette === 'color' ? '글자 색상' : '하이라이트'}</span>
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                if (palette === 'color') setColor(color);
                else editor.chain().focus().toggleHighlight({ color }).run();
                setPalette(null);
              }}
              className="h-7 w-7 rounded-md border border-white/20 transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
          <button
            type="button"
            onClick={() => {
              if (palette === 'color') editor.chain().focus().unsetColor().run();
              else editor.chain().focus().unsetHighlight().run();
              setPalette(null);
            }}
            className="ml-1 rounded-md px-2 py-1 text-xs text-gray-400 hover:bg-white/5 hover:text-white"
          >
            지우기
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-white/10" aria-hidden />;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

function ToolbarButton({ onClick, isActive = false, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
        isActive ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
