"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useMemo, useRef } from "react";
import {
  Alignment,
  Autoformat,
  AutoImage,
  AutoLink,
  Base64UploadAdapter,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  DecoupledEditor,
  Essentials,
  FindAndReplace,
  FontBackgroundColor,
  FontColor,
  FontFamily,
  FontSize,
  Fullscreen,
  GeneralHtmlSupport,
  Heading,
  Highlight,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageInsert,
  ImageInsertViaUrl,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  ImageToolbar,
  ImageUpload,
  Indent,
  IndentBlock,
  Italic,
  Link,
  LinkImage,
  List,
  ListProperties,
  MediaEmbed,
  PageBreak,
  Paragraph,
  PasteFromOffice,
  RemoveFormat,
  SelectAll,
  SourceEditing,
  SpecialCharacters,
  SpecialCharactersEssentials,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TableToolbar,
  TodoList,
  Underline,
  type EditorConfig,
} from "ckeditor5";

type CkDocumentEditorProps = {
  initialValue: string;
  onChange: (value: string) => void;
  onReady: (editor: DecoupledEditor | null) => void;
  placeholder: string;
};

export default function CkDocumentEditor({
  initialValue,
  onChange,
  onReady,
  placeholder,
}: CkDocumentEditorProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  const editorConfig = useMemo<EditorConfig>(
    () => ({
      licenseKey: "GPL",
      placeholder,
      plugins: [
        Alignment,
        Autoformat,
        AutoImage,
        AutoLink,
        Base64UploadAdapter,
        BlockQuote,
        Bold,
        Code,
        CodeBlock,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        Fullscreen,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        Image,
        ImageCaption,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        MediaEmbed,
        PageBreak,
        Paragraph,
        PasteFromOffice,
        RemoveFormat,
        SelectAll,
        SourceEditing,
        SpecialCharacters,
        SpecialCharactersEssentials,
        Strikethrough,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TodoList,
        Underline,
      ],
      toolbar: {
        shouldNotGroupWhenFull: false,
        items: [
          "undo",
          "redo",
          "|",
          "findAndReplace",
          "sourceEditing",
          "fullscreen",
          "|",
          "heading",
          "|",
          "fontFamily",
          "fontSize",
          "fontColor",
          "fontBackgroundColor",
          "highlight",
          "|",
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "subscript",
          "superscript",
          "code",
          "removeFormat",
          "|",
          "alignment",
          "outdent",
          "indent",
          "|",
          "bulletedList",
          "numberedList",
          "todoList",
          "|",
          "link",
          "insertImage",
          "mediaEmbed",
          "insertTable",
          "blockQuote",
          "codeBlock",
          "horizontalLine",
          "pageBreak",
          "specialCharacters",
          "|",
          "selectAll",
        ],
      },
      heading: {
        options: [
          { model: "paragraph", title: "Normal text", class: "ck-heading_paragraph" },
          { model: "heading1", view: "h1", title: "Title", class: "ck-heading_heading1" },
          { model: "heading2", view: "h2", title: "Heading", class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: "Subheading", class: "ck-heading_heading3" },
          { model: "heading4", view: "h4", title: "Small heading", class: "ck-heading_heading4" },
        ],
      },
      fontFamily: {
        supportAllValues: true,
        options: [
          "default",
          "Arial, Helvetica, sans-serif",
          "Georgia, serif",
          "Times New Roman, Times, serif",
          "Courier New, Courier, monospace",
        ],
      },
      fontSize: {
        supportAllValues: true,
        options: [10, 12, 14, "default", 18, 24, 32, 48],
      },
      htmlSupport: {
        allow: [
          {
            name: /.*/,
            attributes: true,
            classes: true,
            styles: true,
          },
        ],
      },
      image: {
        resizeOptions: [
          { name: "resizeImage:original", value: null, label: "Original" },
          { name: "resizeImage:25", value: "25", label: "25%" },
          { name: "resizeImage:50", value: "50", label: "50%" },
          { name: "resizeImage:75", value: "75", label: "75%" },
        ],
        toolbar: [
          "imageTextAlternative",
          "toggleImageCaption",
          "|",
          "imageStyle:inline",
          "imageStyle:block",
          "imageStyle:side",
          "|",
          "resizeImage",
          "linkImage",
        ],
      },
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: "https://",
      },
      list: {
        properties: {
          reversed: true,
          startIndex: true,
          styles: true,
        },
      },
      mediaEmbed: {
        previewsInData: true,
      },
      table: {
        contentToolbar: [
          "tableColumn",
          "tableRow",
          "mergeTableCells",
          "toggleTableCaption",
          "tableProperties",
          "tableCellProperties",
        ],
      },
    }),
    [placeholder],
  );

  return (
    <div className="ckeditor-document-shell min-w-0 bg-[#eef2f7]">
      <div
        className="ckeditor-document-toolbar sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-white px-3 py-2"
        ref={toolbarRef}
      />
      <div className="ckeditor-document-scroll min-h-[36rem] overflow-auto px-4 py-6">
        <CKEditor
          config={editorConfig}
          data={initialValue}
          disableWatchdog
          editor={DecoupledEditor}
          onAfterDestroy={() => {
            if (toolbarRef.current) toolbarRef.current.innerHTML = "";
            onReady(null);
          }}
          onChange={(_, editor) => onChange(editor.getData())}
          onReady={(editor) => {
            const toolbarElement = editor.ui.view.toolbar.element;
            if (toolbarRef.current && toolbarElement) {
              toolbarRef.current.replaceChildren(toolbarElement);
            }
            onReady(editor);
          }}
        />
      </div>
    </div>
  );
}
