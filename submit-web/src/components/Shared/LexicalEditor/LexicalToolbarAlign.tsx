import {
  FormatAlignLeftRounded,
  FormatAlignCenterRounded,
  FormatAlignRightRounded,
  FormatAlignJustifyRounded,
} from "@mui/icons-material";
import {
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ElementFormatType } from "lexical";
import { useState } from "react";

interface AlignmentOption {
  value: ElementFormatType;
  label: string;
  icon: typeof FormatAlignLeftRounded;
}

const alignmentOptions: AlignmentOption[] = [
  { value: "left", label: "Left Align", icon: FormatAlignLeftRounded },
  { value: "center", label: "Center Align", icon: FormatAlignCenterRounded },
  { value: "right", label: "Right Align", icon: FormatAlignRightRounded },
  { value: "justify", label: "Justify Align", icon: FormatAlignJustifyRounded },
];

function LexicalToolbarAlign({
  onAlignmentChange,
}: {
  onAlignmentChange: (value: ElementFormatType) => void;
}) {
  const [alignment, setAlignment] = useState("left");
  const [alignmentAnchorEl, setAlignmentAnchorEl] =
    useState<null | HTMLElement>(null);

  const getCurrentIcon = () => {
    const current = alignmentOptions.find((opt) => opt.value === alignment);
    const Icon = current?.icon || FormatAlignLeftRounded;
    return <Icon fontSize="inherit" />;
  };

  const handleAlignmentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAlignmentAnchorEl(event.currentTarget);
  };

  const handleAlignmentChange = (newAlignment: ElementFormatType) => {
    setAlignmentAnchorEl(null);
    onAlignmentChange(newAlignment);
    setAlignment(newAlignment);
  };

  return (
    <>
      <Tooltip title="Align">
        <IconButton
          onClick={(e) => {
            e.preventDefault();
            handleAlignmentClick(e);
          }}
          className="toolbar-item"
          aria-label="Text Alignment"
        >
          {getCurrentIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={alignmentAnchorEl}
        open={Boolean(alignmentAnchorEl)}
        onClose={() => setAlignmentAnchorEl(null)}
      >
        {alignmentOptions.map(({ value, label, icon: Icon }) => (
          <MenuItem key={value} onClick={() => handleAlignmentChange(value)}>
            <ListItemIcon>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default LexicalToolbarAlign;
