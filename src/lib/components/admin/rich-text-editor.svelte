<script lang="ts">
  import { Editor } from "@tiptap/core"
  import Link from "@tiptap/extension-link"
  import StarterKit from "@tiptap/starter-kit"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Separator } from "$lib/components/ui/separator"
  import { cn } from "$lib/utils"
  import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
  } from "lucide-svelte"
  import { onMount } from "svelte"

  type Props = {
    /**
     * HTML content value
     */
    value?: string | null
    /**
     * Callback when content changes
     */
    onchange: (html: string) => void
    /**
     * Label text for the editor
     */
    label?: string
    /**
     * Placeholder text
     */
    placeholder?: string
    /**
     * Optional CSS classes
     */
    class?: string
  }

  let {
    value = $bindable(),
    onchange,
    label = "Description",
    placeholder = "",
    class: className,
  }: Props = $props()

  let element: HTMLDivElement
  let editor: Editor | null = $state(null)

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3],
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline",
          },
        }),
      ],
      content: value || "",
      editorProps: {
        attributes: {
          class:
            "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 rounded-md border border-input bg-background",
        },
      },
      onTransaction: () => {
        editor = editor
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML()
        value = html
        onchange(html)
      },
    })

    return () => {
      editor?.destroy()
    }
  })

  function toggleBold() {
    editor?.chain().focus().toggleBold().run()
  }

  function toggleItalic() {
    editor?.chain().focus().toggleItalic().run()
  }

  function toggleBulletList() {
    editor?.chain().focus().toggleBulletList().run()
  }

  function toggleOrderedList() {
    editor?.chain().focus().toggleOrderedList().run()
  }

  function toggleHeading2() {
    editor?.chain().focus().toggleHeading({ level: 2 }).run()
  }

  function toggleHeading3() {
    editor?.chain().focus().toggleHeading({ level: 3 }).run()
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }
</script>

<div class={cn("space-y-2", className)}>
  {#if label}
    <Label>{label}</Label>
  {/if}

  <div class="rounded-lg border bg-background">
    <div class="flex flex-wrap gap-1 border-b p-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleBold}
        class={editor?.isActive("bold") ? "bg-muted" : ""}
      >
        <Bold class="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleItalic}
        class={editor?.isActive("italic") ? "bg-muted" : ""}
      >
        <Italic class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-8" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleHeading2}
        class={editor?.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
      >
        <Heading2 class="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleHeading3}
        class={editor?.isActive("heading", { level: 3 }) ? "bg-muted" : ""}
      >
        <Heading3 class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-8" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleBulletList}
        class={editor?.isActive("bulletList") ? "bg-muted" : ""}
      >
        <List class="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={toggleOrderedList}
        class={editor?.isActive("orderedList") ? "bg-muted" : ""}
      >
        <ListOrdered class="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" class="h-8" />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onclick={setLink}
        class={editor?.isActive("link") ? "bg-muted" : ""}
      >
        <LinkIcon class="h-4 w-4" />
      </Button>
    </div>

    <div bind:this={element}></div>
  </div>
</div>
