"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import { supabase } from "../lib/supabase";
import {
  getCurrentActingUserSnapshot,
  getDatabaseSafeUserId,
} from "../lib/actingUser";
import { createWorkLogEntry } from "../lib/workLog";

const WORKSPACE_ID = "ba491d9b-3b36-426d-b98a-f05b0bf271ed";

type Relation<T> = T | T[] | null;

type Community = {
  id: string;
  name: string;
  platform: string | null;
};

type PainPoint = {
  id: string;
  name: string;
  category: string | null;
};

type Company = {
  id: string;
  name: string;
};

type Contact = {
  id: string;
  first_name: string;
  last_name: string | null;
};

type Opportunity = {
  id: string;
  name: string;
};

type MediaAsset = {
  id: string;
  title: string;
  category: string | null;
  tags: string | null;
  description: string | null;
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  file_url: string | null;
  uploaded_by_name: string | null;
  created_at: string | null;
};

type SocialPost = {
  id: string;
  platform: string | null;
  community_id: string | null;
  group_name: string | null;
  post_title: string;
  post_url: string | null;
  post_text: string | null;
  pain_point_id: string | null;
  pain_point_text: string | null;
  goal: string | null;
  media_asset_id: string | null;
  posted_by_name: string | null;
  posted_date: string | null;
  status: string;
  created_at: string | null;
  communities?: Relation<{ id: string; name: string | null }>;
  pain_points?: Relation<{ id: string; name: string | null }>;
  social_media_assets?: Relation<{ id: string; title: string | null }>;
};

const platforms = ["Facebook", "LinkedIn", "Instagram", "X / Twitter", "Other"];
const tones = ["Professional", "Friendly", "Direct", "Humorous"];
const categories = [
  "Recruiting",
  "Contractors",
  "Brokers",
  "Drivers",
  "Knotty Logistics",
  "General Marketing",
];
const statuses = ["Draft", "Posted", "Monitoring", "Closed"];

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  color: "#f8fafc",
  padding: "28px",
  fontFamily: "Arial, sans-serif",
};

const shellStyle: CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const eyebrowStyle: CSSProperties = {
  margin: "0 0 8px",
  color: "#c4b5fd",
  fontSize: "12px",
  fontWeight: 900,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(30px, 4vw, 44px)",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const subtitleStyle: CSSProperties = {
  margin: "10px 0 0",
  color: "#cbd5e1",
  fontSize: "15px",
  lineHeight: 1.55,
  maxWidth: "850px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
  gap: "18px",
};

const cardStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: "22px",
  padding: "18px",
  background:
    "linear-gradient(180deg, rgba(30, 41, 59, 0.86), rgba(15, 23, 42, 0.92))",
  boxShadow: "0 18px 42px rgba(0,0,0,0.24)",
};

const darkCardStyle: CSSProperties = {
  ...cardStyle,
  background:
    "linear-gradient(180deg, rgba(17, 24, 39, 0.94), rgba(8, 13, 24, 0.96))",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
  color: "#dbeafe",
  fontWeight: 850,
  fontSize: "13px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 13px",
  borderRadius: "13px",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  backgroundColor: "rgba(15, 23, 42, 0.94)",
  color: "#f8fafc",
  boxSizing: "border-box",
  outline: "none",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "12px",
};

const buttonStyle: CSSProperties = {
  border: "1px solid rgba(167, 139, 250, 0.55)",
  borderRadius: "999px",
  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
  color: "white",
  fontWeight: 950,
  padding: "12px 16px",
  cursor: "pointer",
  boxShadow: "0 12px 26px rgba(79, 70, 229, 0.28)",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.28)",
  borderRadius: "999px",
  background: "rgba(15, 23, 42, 0.8)",
  color: "#f8fafc",
  fontWeight: 900,
  padding: "10px 13px",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const dangerTextStyle: CSSProperties = {
  border: "1px solid rgba(248, 113, 113, 0.35)",
  background: "rgba(127, 29, 29, 0.24)",
  color: "#fecaca",
  padding: "11px 12px",
  borderRadius: "14px",
};

const goodTextStyle: CSSProperties = {
  border: "1px solid rgba(34, 197, 94, 0.28)",
  background: "rgba(22, 101, 52, 0.18)",
  color: "#bbf7d0",
  padding: "11px 12px",
  borderRadius: "14px",
};

const mutedStyle: CSSProperties = {
  color: "#94a3b8",
  lineHeight: 1.5,
};

const linkStyle: CSSProperties = {
  color: "#c4b5fd",
  textDecoration: "none",
  fontWeight: 900,
};

function singleRelation<T>(value: Relation<T> | undefined) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function preview(value: string | null | undefined, length = 150) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function searchBlob(values: Array<string | null | undefined>) {
  return values.join(" ").toLowerCase();
}

function personName(contact: Contact) {
  return `${contact.first_name} ${contact.last_name || ""}`.trim();
}

export default function SocialIntelligencePage() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [communities, setCommunities] = useState<Community[]>([]);
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);

  const [searchText, setSearchText] = useState("");
  const [showMediaLibraryForm, setShowMediaLibraryForm] = useState(false);
  const [showPublishedPostForm, setShowPublishedPostForm] = useState(false);

  const [builderGroupName, setBuilderGroupName] = useState("Belly Dump Mafia");
  const [builderPlatform, setBuilderPlatform] = useState("Facebook");
  const [builderTopic, setBuilderTopic] = useState("Belly dump trucking");
  const [builderPainPoint, setBuilderPainPoint] = useState("Need trucks");
  const [builderGoal, setBuilderGoal] = useState("Find owner operators");
  const [builderTone, setBuilderTone] = useState("Friendly");
  const [builderGuidance, setBuilderGuidance] = useState(
    "Do not sound cheesy, corporate, cutesy, fake, or like someone who has never had a hard job. No emojis. No fake hype. No saying family. Talk plainly to truckers, owner operators, dispatchers, and contractors like real people with hard jobs and bad backs."
  );
  const [builderDraftText, setBuilderDraftText] = useState("");
  const [builderOptions, setBuilderOptions] = useState<string[]>([]);
  const [builderSource, setBuilderSource] = useState("");
  const [generating, setGenerating] = useState(false);

  const [mediaEditingId, setMediaEditingId] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaCategory, setMediaCategory] = useState("General Marketing");
  const [mediaTags, setMediaTags] = useState("");
  const [mediaDescription, setMediaDescription] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [savingMedia, setSavingMedia] = useState(false);

  const [postPlatform, setPostPlatform] = useState("Facebook");
  const [postCommunityId, setPostCommunityId] = useState("");
  const [postCommunitySearch, setPostCommunitySearch] = useState("");
  const [postGroupName, setPostGroupName] = useState("Belly Dump Mafia");
  const [postTitle, setPostTitle] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [postText, setPostText] = useState("");
  const [postPainPointId, setPostPainPointId] = useState("");
  const [postPainPointSearch, setPostPainPointSearch] = useState("");
  const [postPainPointText, setPostPainPointText] = useState("Need trucks");
  const [postGoal, setPostGoal] = useState("Find owner operators");
  const [postMediaAssetId, setPostMediaAssetId] = useState("");
  const [postMediaAssetSearch, setPostMediaAssetSearch] = useState("");
  const [postCompanyId, setPostCompanyId] = useState("");
  const [postCompanySearch, setPostCompanySearch] = useState("");
  const [postContactId, setPostContactId] = useState("");
  const [postContactSearch, setPostContactSearch] = useState("");
  const [postOpportunityId, setPostOpportunityId] = useState("");
  const [postOpportunitySearch, setPostOpportunitySearch] = useState("");
  const [postPostedDate, setPostPostedDate] = useState("");
  const [postStatus, setPostStatus] = useState("Draft");
  const [savingPost, setSavingPost] = useState(false);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const [
      communityResult,
      painPointResult,
      companyResult,
      contactResult,
      opportunityResult,
      mediaResult,
      postResult,
    ] = await Promise.all([
      supabase
        .from("communities")
        .select("id, name, platform")
        .order("name", { ascending: true }),
      supabase
        .from("pain_points")
        .select("id, name, category")
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(300),
      supabase
        .from("contacts")
        .select("id, first_name, last_name")
        .order("first_name", { ascending: true })
        .limit(300),
      supabase
        .from("opportunities")
        .select("id, name")
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase
        .from("social_media_assets")
        .select(
          "id, title, category, tags, description, file_name, file_type, storage_path, file_url, uploaded_by_name, created_at"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("social_posts")
        .select(
          "id, platform, community_id, group_name, post_title, post_url, post_text, pain_point_id, pain_point_text, goal, media_asset_id, posted_by_name, posted_date, status, created_at, communities(id, name), pain_points(id, name), social_media_assets(id, title)"
        )
        .order("created_at", { ascending: false }),
    ]);

    const firstError =
      communityResult.error ||
      painPointResult.error ||
      companyResult.error ||
      contactResult.error ||
      opportunityResult.error ||
      mediaResult.error ||
      postResult.error;

    setLoading(false);

    if (firstError) {
      setErrorMessage(firstError.message);
      return;
    }

    setCommunities((communityResult.data ?? []) as Community[]);
    setPainPoints((painPointResult.data ?? []) as PainPoint[]);
    setCompanies((companyResult.data ?? []) as Company[]);
    setContacts((contactResult.data ?? []) as Contact[]);
    setOpportunities((opportunityResult.data ?? []) as Opportunity[]);
    setMediaAssets((mediaResult.data ?? []) as MediaAsset[]);
    setSocialPosts((postResult.data ?? []) as unknown as SocialPost[]);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredMedia = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return mediaAssets;

    return mediaAssets.filter((asset) =>
      searchBlob([
        asset.title,
        asset.category,
        asset.tags,
        asset.description,
        asset.file_name,
      ]).includes(q)
    );
  }, [mediaAssets, searchText]);

  const filteredPosts = useMemo(() => {
    const q = searchText.trim().toLowerCase();

    if (!q) return socialPosts;

    return socialPosts.filter((post) => {
      const community = singleRelation(post.communities);
      const painPoint = singleRelation(post.pain_points);
      const media = singleRelation(post.social_media_assets);

      return searchBlob([
        post.platform,
        post.group_name,
        post.post_title,
        post.post_text,
        post.pain_point_text,
        post.goal,
        post.status,
        community?.name,
        painPoint?.name,
        media?.title,
      ]).includes(q);
    });
  }, [socialPosts, searchText]);

  const filteredPostCommunities = useMemo(() => {
    const q = postCommunitySearch.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((community) =>
      searchBlob([community.name, community.platform]).includes(q)
    );
  }, [communities, postCommunitySearch]);

  const filteredPostPainPoints = useMemo(() => {
    const q = postPainPointSearch.trim().toLowerCase();
    if (!q) return painPoints;
    return painPoints.filter((painPoint) =>
      searchBlob([painPoint.name, painPoint.category]).includes(q)
    );
  }, [painPoints, postPainPointSearch]);

  const filteredPostMediaAssets = useMemo(() => {
    const q = postMediaAssetSearch.trim().toLowerCase();
    if (!q) return mediaAssets;
    return mediaAssets.filter((asset) =>
      searchBlob([asset.title, asset.category, asset.tags, asset.description]).includes(q)
    );
  }, [mediaAssets, postMediaAssetSearch]);

  const filteredPostCompanies = useMemo(() => {
    const q = postCompanySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((company) => searchBlob([company.name]).includes(q));
  }, [companies, postCompanySearch]);

  const filteredPostContacts = useMemo(() => {
    const q = postContactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) =>
      searchBlob([contact.first_name, contact.last_name, personName(contact)]).includes(q)
    );
  }, [contacts, postContactSearch]);

  const filteredPostOpportunities = useMemo(() => {
    const q = postOpportunitySearch.trim().toLowerCase();
    if (!q) return opportunities;
    return opportunities.filter((opportunity) =>
      searchBlob([opportunity.name]).includes(q)
    );
  }, [opportunities, postOpportunitySearch]);

  async function generatePosts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setGenerating(true);
    setErrorMessage("");
    setBuilderOptions([]);
    setBuilderSource("");

    try {
      const response = await fetch("/api/social-intelligence/post-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: builderGroupName,
          platform: builderPlatform,
          topic: builderTopic,
          painPoint: builderPainPoint,
          goal: builderGoal,
          tone: builderTone,
          styleGuidance: builderGuidance,
          draftText: builderDraftText,
        }),
      });

      const json = (await response.json()) as {
        postOptions?: string[];
        source?: string;
      };

      if (!response.ok) {
        throw new Error("Post generation failed.");
      }

      setBuilderOptions(json.postOptions ?? []);
      setBuilderSource(json.source || "generated");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Post generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value);
    setSaveMessage("Copied post text.");
  }

  async function saveGeneratedDraft(value: string, index: number) {
    setSavingPost(true);
    setErrorMessage("");
    setSaveMessage("");

    const actingUser = getCurrentActingUserSnapshot();
    const title = `${builderGroupName || "Social"} Draft Option ${String.fromCharCode(
      65 + index
    )}`;

    const result = await supabase
      .from("social_posts")
      .insert({
        workspace_id: WORKSPACE_ID,
        platform: builderPlatform || null,
        group_name: builderGroupName || null,
        post_title: title,
        post_text: value,
        pain_point_text: builderPainPoint || null,
        goal: builderGoal || null,
        status: "Draft",
        posted_by_profile_id: actingUser.profileId,
        posted_by_team_member_id: actingUser.teamMemberId,
        posted_by_name: actingUser.displayName,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    setSavingPost(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "created",
      entityType: "social_post",
      entityId: result.data.id,
      entityLabel: title,
      summary: `Created social draft ${title}.`,
      details: value,
    });

    setSaveMessage(`Draft saved. Open: /social-intelligence/posts/${result.data.id}`);
    await loadData();
  }

  function handleMediaFileChange(event: ChangeEvent<HTMLInputElement>) {
    setMediaFile(event.target.files?.[0] ?? null);
  }

  function editMedia(asset: MediaAsset) {
    setMediaEditingId(asset.id);
    setMediaTitle(asset.title);
    setMediaCategory(asset.category || "General Marketing");
    setMediaTags(asset.tags || "");
    setMediaDescription(asset.description || "");
    setMediaFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetMediaForm() {
    setMediaEditingId("");
    setMediaTitle("");
    setMediaCategory("General Marketing");
    setMediaTags("");
    setMediaDescription("");
    setMediaFile(null);
  }

  async function saveMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingMedia(true);
    setErrorMessage("");
    setSaveMessage("");

    const actingUser = getCurrentActingUserSnapshot();
    let filePayload: Record<string, string | null> = {};

    if (mediaFile) {
      const safeFileName = mediaFile.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const storagePath = `${WORKSPACE_ID}/social-media-assets/${Date.now()}-${safeFileName}`;

      const uploadResult = await supabase.storage
        .from("sell-it-attachments")
        .upload(storagePath, mediaFile);

      if (uploadResult.error) {
        setSavingMedia(false);
        setErrorMessage(uploadResult.error.message);
        return;
      }

      const signedUrlResult = await supabase.storage
        .from("sell-it-attachments")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      filePayload = {
        file_name: mediaFile.name,
        file_type: mediaFile.type || "File",
        storage_path: storagePath,
        file_url: signedUrlResult.data?.signedUrl ?? null,
      };
    }

    if (mediaEditingId) {
      const result = await supabase
        .from("social_media_assets")
        .update({
          title: mediaTitle,
          category: mediaCategory || null,
          tags: mediaTags || null,
          description: mediaDescription || null,
          ...filePayload,
          updated_by: getDatabaseSafeUserId(),
        })
        .eq("id", mediaEditingId);

      setSavingMedia(false);

      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      await createWorkLogEntry({
        actionType: "updated",
        entityType: "social_media_asset",
        entityId: mediaEditingId,
        entityLabel: mediaTitle,
        summary: `Updated media asset ${mediaTitle}.`,
      });

      setSaveMessage("Media item updated.");
      resetMediaForm();
      await loadData();
      return;
    }

    const result = await supabase
      .from("social_media_assets")
      .insert({
        workspace_id: WORKSPACE_ID,
        title: mediaTitle,
        category: mediaCategory || null,
        tags: mediaTags || null,
        description: mediaDescription || null,
        ...filePayload,
        uploaded_by_profile_id: actingUser.profileId,
        uploaded_by_team_member_id: actingUser.teamMemberId,
        uploaded_by_name: actingUser.displayName,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    setSavingMedia(false);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "created",
      entityType: "social_media_asset",
      entityId: result.data.id,
      entityLabel: mediaTitle,
      summary: `Created media asset ${mediaTitle}.`,
    });

    setSaveMessage("Media item saved.");
    resetMediaForm();
    await loadData();
  }

  async function saveTrackedPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSavingPost(true);
    setErrorMessage("");
    setSaveMessage("");

    const actingUser = getCurrentActingUserSnapshot();

    const result = await supabase
      .from("social_posts")
      .insert({
        workspace_id: WORKSPACE_ID,
        platform: postPlatform || null,
        community_id: postCommunityId || null,
        group_name: postGroupName || null,
        post_title: postTitle,
        post_url: postUrl || null,
        post_text: postText || null,
        pain_point_id: postPainPointId || null,
        pain_point_text: postPainPointText || null,
        goal: postGoal || null,
        media_asset_id: postMediaAssetId || null,
        posted_by_profile_id: actingUser.profileId,
        posted_by_team_member_id: actingUser.teamMemberId,
        posted_by_name: actingUser.displayName,
        posted_date: postPostedDate || null,
        status: postStatus,
        created_by: getDatabaseSafeUserId(),
        updated_by: getDatabaseSafeUserId(),
      })
      .select("id")
      .single();

    if (result.error) {
      setSavingPost(false);
      setErrorMessage(result.error.message);
      return;
    }

    const postId = result.data.id as string;
    const relationRows = [];

    if (postCompanyId) {
      relationRows.push(
        supabase.from("social_post_companies").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          company_id: postCompanyId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (postContactId) {
      relationRows.push(
        supabase.from("social_post_contacts").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          contact_id: postContactId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (postOpportunityId) {
      relationRows.push(
        supabase.from("social_post_opportunities").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          opportunity_id: postOpportunityId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    if (postMediaAssetId) {
      relationRows.push(
        supabase.from("social_post_media_assets").insert({
          workspace_id: WORKSPACE_ID,
          social_post_id: postId,
          media_asset_id: postMediaAssetId,
          created_by: getDatabaseSafeUserId(),
        })
      );
    }

    const relationResults = await Promise.all(relationRows);
    const relationError = relationResults.find((item) => item.error)?.error;

    setSavingPost(false);

    if (relationError) {
      setErrorMessage(relationError.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "created",
      entityType: "social_post",
      entityId: postId,
      entityLabel: postTitle,
      summary: `Created tracked social post ${postTitle}.`,
      details: postUrl || postText || null,
    });

    setSaveMessage(`Tracked post saved. Open: /social-intelligence/posts/${postId}`);
    setPostTitle("");
    setPostUrl("");
    setPostText("");
    await loadData();
  }

  async function openMedia(asset: MediaAsset) {
    if (!asset.storage_path) return;

    const signedUrlResult = await supabase.storage
      .from("sell-it-attachments")
      .createSignedUrl(asset.storage_path, 60 * 60);

    if (signedUrlResult.error) {
      setErrorMessage(signedUrlResult.error.message);
      return;
    }

    window.open(signedUrlResult.data.signedUrl, "_blank");
  }

  async function deleteSocialPost(post: SocialPost) {
    const confirmed = window.confirm(
      `Delete this social post draft/record?\n\n${post.post_title}\n\nThis removes the tracked social post record from Sell It. It does not touch Facebook or any outside platform.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSaveMessage("");

    const result = await supabase
      .from("social_posts")
      .delete()
      .eq("id", post.id);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "deleted",
      entityType: "social_post",
      entityId: post.id,
      entityLabel: post.post_title,
      summary: `Deleted social post ${post.post_title}.`,
      details: post.post_text || null,
    });

    setSaveMessage(`Deleted social post: ${post.post_title}`);
    await loadData();
  }

  async function deleteMediaAsset(asset: MediaAsset) {
    const confirmed = window.confirm(
      `Delete this media item?\n\n${asset.title}\n\nThis removes the media library record from Sell It. If a file was uploaded, the stored file may still remain in storage for now.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSaveMessage("");

    const result = await supabase
      .from("social_media_assets")
      .delete()
      .eq("id", asset.id);

    if (result.error) {
      setErrorMessage(result.error.message);
      return;
    }

    await createWorkLogEntry({
      actionType: "deleted",
      entityType: "social_media_asset",
      entityId: asset.id,
      entityLabel: asset.title,
      summary: `Deleted media asset ${asset.title}.`,
      details: asset.description || null,
    });

    setSaveMessage(`Deleted media item: ${asset.title}`);
    await loadData();
  }

  return (
    <main style={pageStyle}>
      <section style={shellStyle}>
        <div style={headerStyle}>
          <div>
            <p style={eyebrowStyle}>Intelligence / Social Intelligence</p>
            <h1 style={titleStyle}>Social Intelligence</h1>
            <p style={subtitleStyle}>
              Create social post drafts, organize marketing media, and track
              published posts without Facebook login, scraping, automated
              posting, or social monitoring.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/communities" style={secondaryButtonStyle}>
              Communities
            </Link>
            <Link href="/posts" style={secondaryButtonStyle}>
              Existing Posts
            </Link>
          </div>
        </div>

        {errorMessage && <p style={dangerTextStyle}>Error: {errorMessage}</p>}
        {saveMessage && <p style={goodTextStyle}>{saveMessage}</p>}

        <section style={{ ...darkCardStyle, marginBottom: "18px" }}>
          <p style={eyebrowStyle}>Search</p>
          <h2 style={{ marginTop: 0 }}>Find social posts or media</h2>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search Need trucks, Belly Dump Mafia, Recruiting, owner operators..."
            style={inputStyle}
          />
          <p style={mutedStyle}>
            Showing {filteredPosts.length} tracked posts and {filteredMedia.length} media items.
          </p>
        </section>

        <section style={{ ...cardStyle, marginBottom: "18px" }}>
          <p style={eyebrowStyle}>Phase 1</p>
          <h2 style={{ marginTop: 0 }}>AI Post Builder</h2>
          <p style={mutedStyle}>
            Generates copy/edit drafts only. It does not log into Facebook, post
            automatically, scrape comments, or monitor anything.
          </p>

          <form onSubmit={generatePosts} style={{ display: "grid", gap: "14px" }}>
            <div style={formGridStyle}>
              <label style={labelStyle}>
                Group Name
                <input
                  value={builderGroupName}
                  onChange={(event) => setBuilderGroupName(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Platform
                <select
                  value={builderPlatform}
                  onChange={(event) => setBuilderPlatform(event.target.value)}
                  style={inputStyle}
                >
                  {platforms.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </label>

              <label style={labelStyle}>
                Tone
                <select
                  value={builderTone}
                  onChange={(event) => setBuilderTone(event.target.value)}
                  style={inputStyle}
                >
                  {tones.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={formGridStyle}>
              <label style={labelStyle}>
                Topic
                <input
                  value={builderTopic}
                  onChange={(event) => setBuilderTopic(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Pain Point
                <input
                  value={builderPainPoint}
                  onChange={(event) => setBuilderPainPoint(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Goal
                <input
                  value={builderGoal}
                  onChange={(event) => setBuilderGoal(event.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <label style={labelStyle}>
                Style / Reality Check Instructions
                <textarea
                  value={builderGuidance}
                  onChange={(event) => setBuilderGuidance(event.target.value)}
                  rows={4}
                  placeholder="Example: Never say hello Belly Dump family. These are 40-year-old truckers with bad backs and hard jobs. Talk plain. No fake hype. No emojis."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <label style={labelStyle}>
                Optional Rough Draft to Polish
                <textarea
                  value={builderDraftText}
                  onChange={(event) => setBuilderDraftText(event.target.value)}
                  rows={5}
                  placeholder="Write your rough version here. The AI will clean it up without changing the real-world tone."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>
            </div>

            <button type="submit" disabled={generating} style={buttonStyle}>
              {generating ? "Generating..." : "Generate / Polish Post Options"}
            </button>
          </form>

          {builderSource && (
            <p style={mutedStyle}>
              Source: {builderSource === "openai" ? "AI generated" : "local safe fallback"}
            </p>
          )}

          {builderOptions.length > 0 && (
            <div style={{ ...gridStyle, marginTop: "16px" }}>
              {builderOptions.map((option, index) => (
                <article key={`${option}-${index}`} style={darkCardStyle}>
                  <p style={eyebrowStyle}>Post Option {String.fromCharCode(65 + index)}</p>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      color: "#f8fafc",
                      fontFamily: "inherit",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {option}
                  </pre>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => copyText(option)}
                      style={secondaryButtonStyle}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBuilderDraftText(option);
                        setSaveMessage("Loaded option into the rough draft box for refinement.");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      style={secondaryButtonStyle}
                    >
                      Refine This
                    </button>
                    <button
                      type="button"
                      onClick={() => saveGeneratedDraft(option, index)}
                      disabled={savingPost}
                      style={buttonStyle}
                    >
                      Save as Draft
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={gridStyle}>
          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={eyebrowStyle}>Phase 2</p>
                <h2 style={{ marginTop: 0 }}>Media Library</h2>
                <p style={mutedStyle}>
                  Store images, videos, PDFs, and marketing assets for later use in
                  tracked social posts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMediaLibraryForm((value) => !value)}
                style={secondaryButtonStyle}
              >
                {showMediaLibraryForm ? "Collapse" : "Add / Edit Media"}
              </button>
            </div>

            {showMediaLibraryForm ? (
            <form onSubmit={saveMedia} style={{ display: "grid", gap: "12px" }}>
              <label style={labelStyle}>
                Title
                <input
                  value={mediaTitle}
                  onChange={(event) => setMediaTitle(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Category
                  <select
                    value={mediaCategory}
                    onChange={(event) => setMediaCategory(event.target.value)}
                    style={inputStyle}
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Tags
                  <input
                    value={mediaTags}
                    onChange={(event) => setMediaTags(event.target.value)}
                    placeholder="belly dump, recruiting, owner operators"
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Description
                <textarea
                  value={mediaDescription}
                  onChange={(event) => setMediaDescription(event.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <label style={labelStyle}>
                File
                <input type="file" onChange={handleMediaFileChange} style={inputStyle} />
              </label>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="submit" disabled={savingMedia} style={buttonStyle}>
                  {savingMedia
                    ? "Saving..."
                    : mediaEditingId
                      ? "Update Media Item"
                      : "Save Media Item"}
                </button>

                {mediaEditingId && (
                  <button type="button" onClick={resetMediaForm} style={secondaryButtonStyle}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
            ) : (
              <p style={{ ...mutedStyle, marginBottom: 0 }}>
                Media Library form is collapsed. Open it only when you need to add or edit marketing media.
              </p>
            )}
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <p style={eyebrowStyle}>Phase 3</p>
                <h2 style={{ marginTop: 0 }}>Published Post Tracking</h2>
                <p style={mutedStyle}>
                  Save the post after you manually publish it. Paste the URL back
                  into Sell It so it can be tracked as a business record.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPublishedPostForm((value) => !value)}
                style={secondaryButtonStyle}
              >
                {showPublishedPostForm ? "Collapse" : "Create Tracked Post"}
              </button>
            </div>

            {showPublishedPostForm ? (
            <form onSubmit={saveTrackedPost} style={{ display: "grid", gap: "12px" }}>
              <label style={labelStyle}>
                Post Title
                <input
                  value={postTitle}
                  onChange={(event) => setPostTitle(event.target.value)}
                  required
                  style={inputStyle}
                />
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Platform
                  <select
                    value={postPlatform}
                    onChange={(event) => setPostPlatform(event.target.value)}
                    style={inputStyle}
                  >
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={labelStyle}>
                  Status
                  <select
                    value={postStatus}
                    onChange={(event) => setPostStatus(event.target.value)}
                    style={inputStyle}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Community
                  <input
                    value={postCommunitySearch}
                    onChange={(event) => setPostCommunitySearch(event.target.value)}
                    placeholder="Search communities..."
                    style={inputStyle}
                  />
                  <select
                    value={postCommunityId}
                    onChange={(event) => setPostCommunityId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No community selected</option>
                    {filteredPostCommunities.map((community) => (
                      <option key={community.id} value={community.id}>
                        {community.name}
                      </option>
                    ))}
                    {postCommunitySearch && filteredPostCommunities.length === 0 && (
                      <option value="" disabled>
                        No matches
                      </option>
                    )}
                  </select>
                </label>

                <label style={labelStyle}>
                  Group / Community Name
                  <input
                    value={postGroupName}
                    onChange={(event) => setPostGroupName(event.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Post URL
                <input
                  value={postUrl}
                  onChange={(event) => setPostUrl(event.target.value)}
                  placeholder="Paste the manual post URL after publishing"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Post Text
                <textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Pain Point
                  <input
                    value={postPainPointSearch}
                    onChange={(event) => setPostPainPointSearch(event.target.value)}
                    placeholder="Search pain points..."
                    style={inputStyle}
                  />
                  <select
                    value={postPainPointId}
                    onChange={(event) => setPostPainPointId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No pain point selected</option>
                    {filteredPostPainPoints.map((painPoint) => (
                      <option key={painPoint.id} value={painPoint.id}>
                        {painPoint.name}
                      </option>
                    ))}
                    {postPainPointSearch && filteredPostPainPoints.length === 0 && (
                      <option value="" disabled>
                        No matches
                      </option>
                    )}
                  </select>
                </label>

                <label style={labelStyle}>
                  Pain Point Text
                  <input
                    value={postPainPointText}
                    onChange={(event) => setPostPainPointText(event.target.value)}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Goal
                <input
                  value={postGoal}
                  onChange={(event) => setPostGoal(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Media Used
                <input
                  value={postMediaAssetSearch}
                  onChange={(event) => setPostMediaAssetSearch(event.target.value)}
                  placeholder="Search media assets..."
                  style={inputStyle}
                />
                <select
                  value={postMediaAssetId}
                  onChange={(event) => setPostMediaAssetId(event.target.value)}
                  style={inputStyle}
                >
                  <option value="">No media selected</option>
                  {filteredPostMediaAssets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.title}
                    </option>
                  ))}
                  {postMediaAssetSearch && filteredPostMediaAssets.length === 0 && (
                    <option value="" disabled>
                      No matches
                    </option>
                  )}
                </select>
              </label>

              <div style={formGridStyle}>
                <label style={labelStyle}>
                  Link Company
                  <input
                    value={postCompanySearch}
                    onChange={(event) => setPostCompanySearch(event.target.value)}
                    placeholder="Search companies..."
                    style={inputStyle}
                  />
                  <select
                    value={postCompanyId}
                    onChange={(event) => setPostCompanyId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No company selected</option>
                    {filteredPostCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                    {postCompanySearch && filteredPostCompanies.length === 0 && (
                      <option value="" disabled>
                        No matches
                      </option>
                    )}
                  </select>
                </label>

                <label style={labelStyle}>
                  Link Contact
                  <input
                    value={postContactSearch}
                    onChange={(event) => setPostContactSearch(event.target.value)}
                    placeholder="Search contacts..."
                    style={inputStyle}
                  />
                  <select
                    value={postContactId}
                    onChange={(event) => setPostContactId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No contact selected</option>
                    {filteredPostContacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {personName(contact)}
                      </option>
                    ))}
                    {postContactSearch && filteredPostContacts.length === 0 && (
                      <option value="" disabled>
                        No matches
                      </option>
                    )}
                  </select>
                </label>

                <label style={labelStyle}>
                  Link Opportunity
                  <input
                    value={postOpportunitySearch}
                    onChange={(event) => setPostOpportunitySearch(event.target.value)}
                    placeholder="Search opportunities..."
                    style={inputStyle}
                  />
                  <select
                    value={postOpportunityId}
                    onChange={(event) => setPostOpportunityId(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">No opportunity selected</option>
                    {filteredPostOpportunities.map((opportunity) => (
                      <option key={opportunity.id} value={opportunity.id}>
                        {opportunity.name}
                      </option>
                    ))}
                    {postOpportunitySearch && filteredPostOpportunities.length === 0 && (
                      <option value="" disabled>
                        No matches
                      </option>
                    )}
                  </select>
                </label>
              </div>

              <label style={labelStyle}>
                Posted Date
                <input
                  type="date"
                  value={postPostedDate}
                  onChange={(event) => setPostPostedDate(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <button type="submit" disabled={savingPost} style={buttonStyle}>
                {savingPost ? "Saving..." : "Save Tracked Post"}
              </button>
            </form>
            ) : (
              <p style={{ ...mutedStyle, marginBottom: 0 }}>
                Published Post Tracking form is collapsed. Open it only when you need to create a tracked post record.
              </p>
            )}
          </section>
        </div>

        <div style={{ ...gridStyle, marginTop: "18px" }}>
          <section style={cardStyle}>
            <p style={eyebrowStyle}>Media Library Results</p>
            <h2 style={{ marginTop: 0 }}>Media Items</h2>

            {loading && <p style={mutedStyle}>Loading media...</p>}
            {!loading && filteredMedia.length === 0 && (
              <p style={mutedStyle}>No media items found.</p>
            )}

            <div style={{ display: "grid", gap: "12px" }}>
              {filteredMedia.map((asset) => (
                <article key={asset.id} style={darkCardStyle}>
                  <h3 style={{ margin: "0 0 8px" }}>{asset.title}</h3>
                  <p style={mutedStyle}>
                    {asset.category || "No category"} | {asset.file_name || "No file attached"}
                  </p>
                  {asset.description && <p style={mutedStyle}>{preview(asset.description)}</p>}
                  {asset.tags && <p style={mutedStyle}>Tags: {asset.tags}</p>}

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link href={`/social-intelligence/media/${asset.id}`} style={secondaryButtonStyle}>
                      Detail
                    </Link>
                    <button type="button" onClick={() => editMedia(asset)} style={secondaryButtonStyle}>
                      Edit
                    </button>
                    <Link href={`/social-intelligence/media/${asset.id}/edit`} style={secondaryButtonStyle}>
                      Edit Page
                    </Link>
                    {asset.storage_path && (
                      <button type="button" onClick={() => openMedia(asset)} style={secondaryButtonStyle}>
                        Open / Download
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteMediaAsset(asset)}
                      style={{
                        ...secondaryButtonStyle,
                        border: "1px solid rgba(248, 113, 113, 0.45)",
                        color: "#fecaca",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={cardStyle}>
            <p style={eyebrowStyle}>Tracked Post Results</p>
            <h2 style={{ marginTop: 0 }}>Social Posts</h2>

            {loading && <p style={mutedStyle}>Loading posts...</p>}
            {!loading && filteredPosts.length === 0 && (
              <p style={mutedStyle}>No social posts found.</p>
            )}

            <div style={{ display: "grid", gap: "12px" }}>
              {filteredPosts.map((post) => {
                const community = singleRelation(post.communities);
                const painPoint = singleRelation(post.pain_points);
                const media = singleRelation(post.social_media_assets);

                return (
                  <article key={post.id} style={darkCardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <h3 style={{ margin: "0 0 8px" }}>{post.post_title}</h3>
                      <strong>{post.status}</strong>
                    </div>

                    <p style={mutedStyle}>
                      {post.platform || "No platform"} | {community?.name || post.group_name || "No group"} |{" "}
                      {post.posted_date || "No posted date"}
                    </p>

                    <p style={mutedStyle}>
                      Pain Point: {painPoint?.name || post.pain_point_text || "None"} | Goal:{" "}
                      {post.goal || "None"} | Media: {media?.title || "None"}
                    </p>

                    {post.post_text && <p style={mutedStyle}>{preview(post.post_text)}</p>}

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <Link href={`/social-intelligence/posts/${post.id}`} style={secondaryButtonStyle}>
                        Detail
                      </Link>
                      <Link href={`/social-intelligence/posts/${post.id}/edit`} style={secondaryButtonStyle}>
                        Edit
                      </Link>
                      {post.post_url && (
                        <a href={post.post_url} target="_blank" rel="noreferrer" style={secondaryButtonStyle}>
                          Open Published URL
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteSocialPost(post)}
                        style={{
                          ...secondaryButtonStyle,
                          border: "1px solid rgba(248, 113, 113, 0.45)",
                          color: "#fecaca",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}


