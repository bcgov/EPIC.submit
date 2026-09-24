import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { Box, Grid, InputLabel, Tooltip } from "@mui/material";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  EditorState,
  LexicalEditor as Editor,
} from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { BCDesignTokens } from "epic.theme";
import LexicalToolbar from "./LexicalToolbar";
import { LexicalTheme } from "./LexicalUtils";
import "./LexicalEditor.scss";

export type TextEditorValue = {
  html: string;
  text: string;
};

type LexicalEditorProps = {
  errorMsg?: string;
  placeholder: string;
  defaultHtml?: string;
  label?: string;
  name?: string;
  height?: string;
  isAdvanced?: boolean;
  onChange: (editorState: EditorState, editor: Editor) => void;
  isRequired?: boolean;
  disabled?: boolean;
};

const LexicalEditor = ({
  errorMsg,
  placeholder,
  defaultHtml = "",
  label = "",
  name,
  height,
  onChange,
  isAdvanced = false,
  isRequired = false,
  disabled = false,
}: LexicalEditorProps) => {
  const editorConfig = {
    namespace: "EAOBannerEditor",
    theme: LexicalTheme,
    nodes: [ListNode, ListItemNode, LinkNode],
    onError(error: unknown) {
      throw error;
    },
    editorState: (editor: Editor) => {
      const parser = new DOMParser();
      editor.update(() => {
        $getRoot().clear();

        if (defaultHtml) {
          const dom = parser.parseFromString(defaultHtml, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().append(...nodes);
        } else {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(""));
          $getRoot().append(paragraph);
        }
      });
    },
    editable: !disabled,
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <Grid container>
        <Grid item xs={2}>
          <Tooltip title={label} arrow>
            <span>
              <InputLabel
                sx={{
                  position: "static",
                  transform: "none",
                  fontSize: "0.875rem",
                  lineHeight: "1.5rem",
                  color: errorMsg
                    ? BCDesignTokens.typographyColorDanger
                    : BCDesignTokens.typographyColorPrimary,
                  fontWeight: isRequired ? "bold" : "normal",
                }}
                htmlFor={name}
                size="small"
              >
                {label}
              </InputLabel>
            </span>
          </Tooltip>
        </Grid>
        <Grid item xs={10} sx={{ textAlign: "right" }}>
          {!disabled && <LexicalToolbar isAdvanced={isAdvanced} />}
        </Grid>
      </Grid>
      <Box
        className="editor-container"
        sx={{
          border: errorMsg
            ? `1px solid ${BCDesignTokens.supportBorderColorDanger}`
            : `1px solid ${BCDesignTokens.surfaceColorBorderDefault}`,
          height: height ? height : "auto",
          overflowY: "auto",
          backgroundColor: disabled
            ? BCDesignTokens.surfaceColorFormsDisabled
            : BCDesignTokens.surfaceColorFormsDefault,
        }}
      >
        <Box className="editor-inner editor-content">
          <RichTextPlugin
            contentEditable={
              <div>
                <ContentEditable
                  className="editor-input"
                  aria-placeholder={placeholder}
                  placeholder={
                    <div className="editor-placeholder">{placeholder}</div>
                  }
                />
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangePlugin onChange={onChange} />
          <ListPlugin />
          <LinkPlugin />
          <TabIndentationPlugin maxIndent={7} />
          <HistoryPlugin />
        </Box>
      </Box>
    </LexicalComposer>
  );
};

export default LexicalEditor;
