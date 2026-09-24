import { useMemo, useState } from "react";
import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { BCDesignTokens } from "epic.theme";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { $generateHtmlFromNodes } from "@lexical/html";
import { EditorState, LexicalEditor as Editor } from "lexical";
import LexicalEditor from "@/components/Shared/LexicalEditor/LexicalEditor";
import ControlledSelect from "@/components/Shared/ControlledFormFields/ControlledSelect";
import { LoadingButton } from "@/components/Shared/LoadingButton";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import {
  BANNER_TYPE,
  BannerConfiguration,
  BannerType,
} from "@/models/BannerConfiguration";
import {
  useCreateBannerConfiguration,
  useGetBannerConfigurations,
  useUpdateBannerConfiguration,
} from "@/hooks/api/useBannerConfigurations";

const bannerTypeOptions = Object.values(BANNER_TYPE).map((value) => ({
  value,
  label: value === BANNER_TYPE.NONE ? "No background" : value,
}));

const bannerSchema = yup.object().shape({
  banner_type: yup
    .string()
    .oneOf(Object.values(BANNER_TYPE))
    .required("Type is required."),
  content: yup.string().required("Content is required."),
  is_active: yup.boolean().required(),
});

type BannerFormValues = {
  banner_type: BannerType;
  content: string;
  is_active: boolean;
};

const EMPTY_HTML_PATTERNS = ["", "<p></p>", "<p><br></p>"];

const isEmptyHtml = (html: string) => {
  const trimmed = html.trim();
  return (
    EMPTY_HTML_PATTERNS.includes(trimmed) ||
    trimmed.replace(/<[^>]*>/g, "").trim().length === 0
  );
};

export const BannerConfigurationForm = () => {
  const { data: banners, isLoading } = useGetBannerConfigurations();
  const activeBanner: BannerConfiguration | undefined = banners?.[0];

  const [saving, setSaving] = useState(false);

  const defaultValues = useMemo<BannerFormValues>(
    () => ({
      banner_type: activeBanner?.banner_type ?? BANNER_TYPE.INFO,
      content: activeBanner?.content ?? "",
      is_active: activeBanner?.is_active ?? false,
    }),
    [activeBanner],
  );

  const methods = useForm<BannerFormValues>({
    resolver: yupResolver(bannerSchema),
    mode: "onSubmit",
    values: defaultValues,
  });

  const { handleSubmit, control, setValue } = methods;

  const { mutate: createBanner } = useCreateBannerConfiguration();
  const { mutate: updateBanner } = useUpdateBannerConfiguration();

  const handleEditorChange = (_editorState: EditorState, editor: Editor) => {
    editor.read(() => {
      const html = $generateHtmlFromNodes(editor);
      setValue("content", isEmptyHtml(html) ? "" : html, {
        shouldValidate: false,
      });
    });
  };

  const onSuccess = () => {
    setSaving(false);
    notify.success("Banner configuration saved successfully");
  };

  const onError = () => {
    setSaving(false);
    notify.error("Failed to save banner configuration");
  };

  const onSubmit = (values: BannerFormValues) => {
    setSaving(true);
    const payload = {
      banner_type: values.banner_type,
      content: values.content,
      is_active: values.is_active,
    };

    if (activeBanner) {
      updateBanner(
        { bannerId: activeBanner.id, data: payload },
        { onSuccess, onError },
      );
    } else {
      createBanner({ data: payload }, { onSuccess, onError });
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <Box sx={{ maxWidth: 360 }}>
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ mb: BCDesignTokens.layoutMarginSmall }}
            >
              Type
            </Typography>
            <ControlledSelect
              name="banner_type"
              placeholder="Select a banner type"
              clearable={false}
              options={bannerTypeOptions}
            />
          </Box>

          <Box>
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ mb: BCDesignTokens.layoutMarginSmall }}
            >
              Content
            </Typography>
            <Controller
              control={control}
              name="content"
              render={({ fieldState }) => (
                <LexicalEditor
                  placeholder="Enter the banner content"
                  defaultHtml={defaultValues.content}
                  onChange={handleEditorChange}
                  isAdvanced
                  errorMsg={fieldState.error?.message}
                  height="220px"
                />
              )}
            />
          </Box>

          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    color="primary"
                  />
                }
                label={field.value ? "Enabled" : "Disabled"}
              />
            )}
          />

          <Box>
            <LoadingButton
              type="submit"
              variant="contained"
              color="secondary"
              loading={saving}
            >
              Save
            </LoadingButton>
          </Box>
        </Stack>
      </form>
    </FormProvider>
  );
};
