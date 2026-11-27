"use client";

import { CKEditor } from "@ckeditor/ckeditor5-react";
import { useMemo, useRef, useState } from "react";
import "ckeditor5/ckeditor5.css";
import vietnamese from "ckeditor5/translations/vi.js";
import {
  Alignment,
  Autoformat,
  AutoImage,
  AutoLink,
  BlockQuote,
  Bold,
  Code,
  CodeBlock,
  DecoupledEditor,
  Essentials,
  FindAndReplace,
  FileRepository,
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
  type Editor,
  type EditorConfig,
  type FileLoader,
  type UploadAdapter,
} from "ckeditor5";
import { uploadMedia } from "@/api/media";
import { useTranslation } from "@/providers/I18nProvider";

class ServerUploadAdapter implements UploadAdapter {
  private readonly abortController = new AbortController();

  constructor(private readonly loader: FileLoader) {}

  abort() {
    this.abortController.abort();
  }

  async upload() {
    const file = await this.loader.file;
    if (!file) throw new Error("No image was selected.");

    const media = await uploadMedia(file, this.abortController.signal);
    return { default: media.url };
  }
}

function ServerUploadAdapterPlugin(editor: Editor) {
  const repository = editor.plugins.get(FileRepository);
  repository.createUploadAdapter = (loader) => new ServerUploadAdapter(loader);
}

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
  const { locale, t } = useTranslation();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<{ initialValue: string; html: string } | null>(null);
  const editorData = draft?.initialValue === initialValue ? draft.html : initialValue;

  const editorConfig = useMemo<EditorConfig>(
    () => ({
      licenseKey: "GPL",
      language: locale,
      placeholder,
      translations: locale === "vi" ? [vietnamese] : [],
      extraPlugins: [ServerUploadAdapterPlugin],
      plugins: [
        Alignment,
        Autoformat,
        AutoImage,
        AutoLink,
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
          { model: "paragraph", title: t("editor.heading.normal"), class: "ck-heading_paragraph" },
          { model: "heading1", view: "h1", title: t("editor.heading.title"), class: "ck-heading_heading1" },
          { model: "heading2", view: "h2", title: t("editor.heading.heading"), class: "ck-heading_heading2" },
          { model: "heading3", view: "h3", title: t("editor.heading.subheading"), class: "ck-heading_heading3" },
          { model: "heading4", view: "h4", title: t("editor.heading.small"), class: "ck-heading_heading4" },
          { model: "heading5", view: "h5", title: t("editor.heading.minor"), class: "ck-heading_heading5" },
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
    [locale, placeholder, t],
  );

  return (
    <div className="ckeditor-document-shell min-w-0 bg-[var(--bg-card)]">
      <div
        className="ckeditor-document-toolbar sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2"
        ref={toolbarRef}
      />
      <div className="ckeditor-document-scroll min-h-[36rem] overflow-auto px-4 py-6">
        <CKEditor
          config={editorConfig}
          data={editorData}
          disableWatchdog
          editor={DecoupledEditor}
          id={locale}
          onAfterDestroy={() => {
            if (toolbarRef.current) toolbarRef.current.innerHTML = "";
            onReady(null);
          }}
          onChange={(_, editor) => {
            const html = editor.getData();
            setDraft({ initialValue, html });
            onChange(html);
          }}
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
