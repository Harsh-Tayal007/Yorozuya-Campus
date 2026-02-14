import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Github, Linkedin, Twitter, MessageCircle } from "lucide-react"
import { FaDiscord } from 'react-icons/fa'

const ANIMATION_DURATION = 0.6

export default function Footer() {
    return (
        <footer className="relative w-full border-t border-border/40 bg-background/80 backdrop-blur-md">



            {/* 🌌 Subtle Gradient Top Blend */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

            <div className="w-full">
                <div className="mx-auto max-w-7xl px-6 py-16">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: ANIMATION_DURATION }}
                        className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4"
                    >
                        {/* Brand + Social */}
                        <div>
                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                                Unizuya
                            </h3>

                            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                                A unified academic platform helping students access syllabus,
                                resources, and PYQs — all in one place.
                            </p>

                            {/* 🔥 Social Icons */}
                            <div className="mt-6 flex items-center gap-4">
                                <SocialIcon icon={Twitter} href="https://twitter.com" />
                                <SocialIcon icon={Linkedin} href="https://linkedin.com" />
                                <SocialIcon icon={Github} href="https://github.com" />
                                <SocialIcon icon={FaDiscord} href="https://discord.com" />
                            </div>
                        </div>

                        <FooterColumn
                            title="Platform"
                            links={[
                                { name: "Universities", to: "/universities" },
                                { name: "Programs", to: "/universities" },
                                { name: "Resources", to: "/universities" },
                                { name: "PYQs", to: "/universities" },
                            ]}
                        />

                        <FooterColumn
                            title="Company"
                            links={[
                                { name: "About", to: "/" },
                                { name: "Contact", to: "/" },
                                { name: "Privacy Policy", to: "/" },
                            ]}
                        />

                        <FooterColumn
                            title="Support"
                            links={[
                                { name: "Help Center", to: "/" },
                                { name: "Community", to: "/" },
                                { name: "Status", to: "/" },
                            ]}
                        />
                    </motion.div>

                    {/* Bottom */}
                    <div className="mt-14 border-t border-border/40 pt-8 text-center">
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Unizuya. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    )
}

function FooterColumn({ title, links }) {
    return (
        <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground">
                {title}
            </h4>

            <ul className="space-y-3">
                {links.map((link) => (
                    <li key={link.name}>
                        <Link
                            to={link.to}
                            className="text-sm text-muted-foreground transition-colors duration-200 hover:text-blue-500"
                        >
                            {link.name}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function SocialIcon({ icon: Icon, href }) {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.15 }}
            transition={{ duration: 0.2 }}
           className="
  p-2 rounded-lg
  bg-card
  border border-border
  text-muted-foreground
  hover:text-blue-400
  hover:border-blue-400/60
  hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]
  transition-colors duration-200
"
        >
            <Icon size={16} />
        </motion.a>
    )
}

