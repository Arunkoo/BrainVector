import { Link } from "react-router-dom";
import { ArrowRight, FileText, Users, Zap, Code } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            BrainVector
            <span className="block text-xl md:text-2xl text-primary font-normal mt-2">
              Modern Document Management
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10">
            A complete document workspace system built with modern web
            technologies. Create, organize, and collaborate on documents with
            ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90"
            >
              Try Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/Arunkoo/BrainVector"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border font-medium rounded-lg hover:bg-muted"
            >
              <Code className="h-4 w-4" />
              View Code
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-border rounded-xl">
            <div className="inline-flex p-3 rounded-lg bg-blue-500/10 text-blue-500 mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Create Workspaces</h3>
            <p className="text-muted-foreground">
              Set up multiple workspaces for different projects or teams.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl">
            <div className="inline-flex p-3 rounded-lg bg-purple-500/10 text-purple-500 mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Add Documents</h3>
            <p className="text-muted-foreground">
              Use the rich text editor to create and format documents.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl">
            <div className="inline-flex p-3 rounded-lg bg-green-500/10 text-green-500 mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Collaborate</h3>
            <p className="text-muted-foreground">
              Share workspaces and edit documents with team members.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-10">Key Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-3">
              Multi-tenant Workspaces
            </h3>
            <p className="text-muted-foreground">
              Separate environments for different teams or clients with isolated
              documents and permissions.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-3">Rich Text Editor</h3>
            <p className="text-muted-foreground">
              Built with Tiptap.js featuring formatting, headings, lists, and
              code blocks.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-3">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Auto-save functionality and instant updates across all connected
              devices.
            </p>
          </div>

          <div className="p-6 border border-border rounded-xl">
            <h3 className="text-lg font-semibold mb-3">Secure & Scalable</h3>
            <p className="text-muted-foreground">
              JWT authentication, protected routes, and modern state management
              with Zustand.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Built With</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            "React",
            "TypeScript",
            "Tailwind CSS",
            "Zustand",
            "React Router",
            "Tiptap",
            "Vite",
            "JWT",
          ].map((tech) => (
            <div
              key={tech}
              className="p-4 text-center border border-border rounded-lg"
            >
              <div className="font-medium">{tech}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 max-w-3xl mx-auto text-center">
        <div className="p-8 border border-border rounded-xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-muted-foreground mb-6">
            Experience a complete document management system built with modern
            web technologies.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90"
          >
            Launch Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t border-border">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm text-muted-foreground">
            A showcase project demonstrating modern Full-stack Development
            skills • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
